require("dotenv").config();
const axios = require("axios");
const mysql = require("mysql2/promise");
const ingestQueue = require("./queue");

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, API_VERSION } = process.env;

const syncData = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });
    console.log("🔌 [Scheduler] Connected to MySQL (Reading Tenants)");

    const [tenants] = await connection.execute("SELECT * FROM tenants");

    if (tenants.length === 0) {
      console.log("⚠️ No tenants found.");
      return;
    }

    for (const tenant of tenants) {
      const { shop_domain, access_token } = tenant;
      console.log(`\n🔄 [Producer] Fetching data for: ${shop_domain}`);

      const shopify = axios.create({
        baseURL: `https://${shop_domain}/admin/api/${API_VERSION}`,
        headers: { "X-Shopify-Access-Token": access_token },
      });

      try {
        const custRes = await shopify.get("/customers.json");
        custRes.data.customers.forEach((c) => {
          ingestQueue.add("customer", {
            shopify_id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            email: c.email,
            total_spent: c.total_spent,
            shop_domain,
          });
        });

        const prodRes = await shopify.get("/products.json");
        prodRes.data.products.forEach((p) => {
          ingestQueue.add("product", {
            shopify_id: p.id,
            title: p.title,
            price: p.variants.length > 0 ? p.variants[0].price : 0,
            shop_domain,
          });
        });

        const ordRes = await shopify.get("/orders.json?status=any");
        ordRes.data.orders.forEach((o) => {
          ingestQueue.add("order", {
            shopify_id: o.id,
            order_number: o.order_number,
            total_price: o.total_price,
            currency: o.currency,
            customer_id: o.customer ? o.customer.id : null,
            created_at: new Date(o.created_at),
            shop_domain,
          });
        });

        const checkoutsRes = await shopify.get("/checkouts.json");
        checkoutsRes.data.checkouts.forEach((chk) => {
          ingestQueue.add("checkout", {
            id: chk.id,
            token: chk.token,
            total_price: chk.total_price,
            currency: chk.currency,
            email: chk.email || (chk.customer ? chk.customer.email : null),
            url: chk.abandoned_checkout_url,
            created_at: new Date(chk.created_at),
            updated_at: new Date(chk.updated_at),
            shop_domain,
          });
        });

        console.log(`[${shop_domain}] Jobs pushed to Redis`);
      } catch (tenantError) {
        console.error(`   Error fetching ${shop_domain}:`, tenantError.message);
      }
    }
  } catch (error) {
    console.error(" Fatal Producer Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
};

module.exports = { syncData };
