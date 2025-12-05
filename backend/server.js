require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const cron = require("node-cron");
const { syncData } = require("./ingest");
require("./worker");

const app = express();
app.use(
  cors({
    origin: ["https://xeno-shopify-ivory.vercel.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

const { DB_HOST, DB_USER, DB_PASS, DB_NAME } = process.env;

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
});

const getTenant = (req) => {
  const shop = req.headers["x-shop-domain"];
  if (!shop) throw new Error("No shop domain provided");
  return shop;
};

app.get("/api/stats", async (req, res) => {
  try {
    const shop = getTenant(req);
    const [customerRows] = await db.execute(
      "SELECT COUNT(*) as count FROM customers WHERE shop_domain = ?",
      [shop]
    );
    const [orderRows] = await db.execute(
      "SELECT COUNT(*) as count, SUM(total_price) as revenue FROM orders WHERE shop_domain = ?",
      [shop]
    );
    res.json({
      total_customers: customerRows[0].count,
      total_orders: orderRows[0].count,
      total_revenue: orderRows[0].revenue || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/customers/top", async (req, res) => {
  try {
    const shop = getTenant(req);
    const [rows] = await db.execute(
      "SELECT name, email, total_spent FROM customers WHERE shop_domain = ? ORDER BY total_spent DESC LIMIT 5",
      [shop]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders/trend", async (req, res) => {
  try {
    const shop = getTenant(req);
    const { startDate, endDate } = req.query;

    let query = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count, SUM(total_price) as revenue 
      FROM orders 
      WHERE shop_domain = ?
    `;

    const params = [shop];

    if (startDate) {
      query += ` AND created_at >= ?`;
      params.push(new Date(startDate));
    }
    if (endDate) {
      query += ` AND created_at <= ?`;
      params.push(new Date(endDate));
    }

    query += `
      GROUP BY date 
      ORDER BY date ASC
    `;

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/checkouts/abandoned", async (req, res) => {
  try {
    const shop = getTenant(req);
    const [rows] = await db.execute(
      "SELECT * FROM abandoned_checkouts WHERE shop_domain = ? ORDER BY created_at DESC",
      [shop]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    if (rows.length > 0) {
      const user = rows[0];
      res.json({ success: true, shop_domain: user.shop_domain });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/stats/advanced", async (req, res) => {
  try {
    const shop = getTenant(req);
    const [segments] = await db.execute(
      `
      SELECT name, COUNT(*) as value 
      FROM (
          SELECT 
              CASE 
                  WHEN total_spent > 1000 THEN 'VIP (>1000)'
                  WHEN total_spent BETWEEN 200 AND 1000 THEN 'Loyal (200-1000)'
                  ELSE 'New (<200)'
              END as name
          FROM customers
          WHERE shop_domain = ?
      ) as derived_table
      GROUP BY name
    `,
      [shop]
    );

    const [lostRows] = await db.execute(
      "SELECT SUM(total_price) as lost_revenue FROM abandoned_checkouts WHERE shop_domain = ?",
      [shop]
    );
    const lostRevenue = lostRows[0].lost_revenue || 0;

    res.json({ segments, lostRevenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  const { email, password, shop_domain, access_token } = req.body;
  if (!email || !password || !shop_domain || !access_token) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO tenants (shop_domain, access_token) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE access_token = ?`,
      [shop_domain, access_token, access_token]
    );

    await connection.execute(
      `INSERT INTO users (email, password, shop_domain) VALUES (?, ?, ?)`,
      [email, password, shop_domain]
    );

    await connection.commit();
    res.json({ success: true, message: "Store connected successfully!" });

    syncData();
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: "Registration failed." });
  } finally {
    if (connection) connection.release();
  }
});

cron.schedule("0 * * * *", async () => {
  console.log("⏳ [Scheduler] Running hourly data sync...");
  await syncData();
  console.log("✅ [Scheduler] Sync finished.");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Scheduler active: Syncing data every hour.");
});
