require("dotenv").config();
const axios = require("axios");
const mysql = require("mysql2/promise");

const {
  SHOPIFY_STORE_URL,
  SHOPIFY_ACCESS_TOKEN,
  API_VERSION,
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
} = process.env;

// 1. Setup Shopify Connection
const shopify = axios.create({
  baseURL: `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}`,
  headers: { "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN },
});

// 2. Main Function
const syncData = async () => {
  let connection;
  try {
    // Connect to Database
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    });
    console.log("🔌 Connected to MySQL Database");

    // Define tenantId inside the try block so all parts can use it
    const tenantId = SHOPIFY_STORE_URL;

    // --- PART A: CUSTOMERS ---
    console.log("📥 Fetching Customers...");
    const custRes = await shopify.get("/customers.json");
    const customers = custRes.data.customers;

    for (const c of customers) {
      await connection.execute(
        `INSERT IGNORE INTO customers (shopify_id, name, email, total_spent, shop_domain) VALUES (?, ?, ?, ?, ?)`,
        [
          c.id,
          `${c.first_name} ${c.last_name}`,
          c.email,
          c.total_spent,
          tenantId,
        ]
      );
    }
    console.log(`✅ Saved ${customers.length} Customers`);

    // --- PART B: PRODUCTS ---
    console.log("📥 Fetching Products...");
    const prodRes = await shopify.get("/products.json");
    const products = prodRes.data.products;

    for (const p of products) {
      // Products can have multiple variants (prices), we take the first one for simplicity
      const price = p.variants.length > 0 ? p.variants[0].price : 0;
      await connection.execute(
        `INSERT IGNORE INTO products (shopify_id, title, price, shop_domain) VALUES (?, ?, ?, ?)`,
        [p.id, p.title, price, tenantId]
      );
    }
    console.log(`✅ Saved ${products.length} Products`);

    // --- PART C: ORDERS ---
    console.log("📥 Fetching Orders...");
    const ordRes = await shopify.get("/orders.json?status=any");
    const orders = ordRes.data.orders;

    for (const o of orders) {
      const customerId = o.customer ? o.customer.id : null;
      await connection.execute(
        `INSERT IGNORE INTO orders (shopify_id, order_number, total_price, currency, customer_shopify_id, shop_domain) VALUES (?, ?, ?, ?, ?, ?)`,
        [o.id, o.order_number, o.total_price, o.currency, customerId, tenantId]
      );
    }
    console.log(`✅ Saved ${orders.length} Orders`);

    // --- PART D: ABANDONED CHECKOUTS (Bonus) ---
    console.log("📥 Fetching Abandoned Checkouts...");
    try {
      const checkoutsRes = await shopify.get("/checkouts.json");
      const checkouts = checkoutsRes.data.checkouts;

      for (const chk of checkouts) {
        // Determine the email (sometimes it's directly on the object, sometimes in customer object)
        const email = chk.email || (chk.customer ? chk.customer.email : null);

        await connection.execute(
          `INSERT IGNORE INTO abandoned_checkouts 
                (shopify_checkout_id, token, total_price, currency, customer_email, abandoned_url, shop_domain, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            chk.id,
            chk.token,
            chk.total_price,
            chk.currency,
            email,
            chk.abandoned_checkout_url,
            tenantId,
            new Date(chk.created_at),
            new Date(chk.updated_at),
          ]
        );
      }
      console.log(`✅ Saved ${checkouts.length} Abandoned Checkouts`);
    } catch (err) {
      // We use a separate try/catch here so if checkouts fail, the whole script doesn't crash
      console.error(
        "⚠️ Error with checkouts:",
        err.response ? err.response.data : err.message
      );
    }
  } catch (error) {
    console.error("❌ Fatal Error:", error.message);
  } finally {
    // THIS closes the connection. It must run LAST.
    if (connection) await connection.end();
    console.log("🔌 Database Connection Closed");
  }
};

syncData();
