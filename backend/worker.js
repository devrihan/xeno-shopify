require("dotenv").config();
const mysql = require("mysql2/promise");
const ingestQueue = require("./queue");

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

const startWorker = async () => {
  const db = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log("👷 [Worker] Started. Listening for jobs...");

  ingestQueue.process("customer", async (job) => {
    const { shopify_id, name, email, total_spent, shop_domain } = job.data;
    try {
      await db.execute(
        `INSERT IGNORE INTO customers (shopify_id, name, email, total_spent, shop_domain) VALUES (?, ?, ?, ?, ?)`,
        [shopify_id, name, email, total_spent, shop_domain]
      );
      console.log(`    [Worker] Saved Customer: ${email}`);
    } catch (err) {
      console.error(`    [Worker] Customer Error: ${err.message}`);
    }
  });

  ingestQueue.process("product", async (job) => {
    const { shopify_id, title, price, shop_domain } = job.data;
    try {
      await db.execute(
        `INSERT IGNORE INTO products (shopify_id, title, price, shop_domain) VALUES (?, ?, ?, ?)`,
        [shopify_id, title, price, shop_domain]
      );
      console.log(`    [Worker] Saved Product: ${title}`);
    } catch (err) {
      console.error(`    [Worker] Product Error: ${err.message}`);
    }
  });

  ingestQueue.process("order", async (job) => {
    const {
      shopify_id,
      order_number,
      total_price,
      currency,
      customer_id,
      shop_domain,
      created_at,
    } = job.data;
    try {
      await db.execute(
        `INSERT IGNORE INTO orders (shopify_id, order_number, total_price, currency, customer_shopify_id, shop_domain, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          shopify_id,
          order_number,
          total_price,
          currency,
          customer_id,
          shop_domain,
          created_at,
        ]
      );
      console.log(`    [Worker] Saved Order: #${order_number}`);
    } catch (err) {
      console.error(`    [Worker] Order Error: ${err.message}`);
    }
  });

  ingestQueue.process("checkout", async (job) => {
    const {
      id,
      token,
      total_price,
      currency,
      email,
      url,
      shop_domain,
      created_at,
      updated_at,
    } = job.data;
    try {
      await db.execute(
        `INSERT IGNORE INTO abandoned_checkouts 
        (shopify_checkout_id, token, total_price, currency, customer_email, abandoned_url, shop_domain, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          token,
          total_price,
          currency,
          email,
          url,
          shop_domain,
          created_at,
          updated_at,
        ]
      );
      console.log(`    [Worker] Saved Checkout: ${email || "Anonymous"}`);
    } catch (err) {
      console.error(`    [Worker] Checkout Error: ${err.message}`);
    }
  });
};

startWorker();
