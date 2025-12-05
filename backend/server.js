require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, SHOPIFY_STORE_URL } = process.env;

// Create a connection pool (better for servers than a single connection)
const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
});

// 1. API: Get Overall Stats (Total Customers, Orders, Revenue)
app.get("/api/stats", async (req, res) => {
  try {
    const [customerRows] = await db.execute(
      "SELECT COUNT(*) as count FROM customers"
    );
    const [orderRows] = await db.execute(
      "SELECT COUNT(*) as count, SUM(total_price) as revenue FROM orders"
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

// 2. API: Get Top 5 Customers by Spend
app.get("/api/customers/top", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT name, email, total_spent FROM customers ORDER BY total_spent DESC LIMIT 5"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. API: Get Orders Trend (Grouped by Day) - For the Chart
app.get("/api/orders/trend", async (req, res) => {
  try {
    // MySQL specific date formatting
    const query = `
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count, SUM(total_price) as revenue 
            FROM orders 
            GROUP BY date 
            ORDER BY date ASC
        `;
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. API: Get Abandoned Checkouts (Bonus)
app.get("/api/checkouts/abandoned", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM abandoned_checkouts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. API: Login Endpoint
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
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

// 6. API: Advanced Analytics (Customer Segments & Lost Revenue)
app.get("/api/stats/advanced", async (req, res) => {
  try {
    // A. Customer Segments (VIP vs Regular vs New)
    // FIX: We use a "Derived Table" (Subquery) to solve the GROUP BY error
    const [segments] = await db.execute(`
            SELECT name, COUNT(*) as value 
            FROM (
                SELECT 
                    CASE 
                        WHEN total_spent > 1000 THEN 'VIP (>1000)'
                        WHEN total_spent BETWEEN 200 AND 1000 THEN 'Loyal (200-1000)'
                        ELSE 'New (<200)'
                    END as name
                FROM customers
            ) as derived_table
            GROUP BY name
        `);

    // B. Calculate Lost Revenue
    const [lostRows] = await db.execute(
      "SELECT SUM(total_price) as lost_revenue FROM abandoned_checkouts"
    );
    const lostRevenue = lostRows[0].lost_revenue || 0;

    res.json({
      segments,
      lostRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
