const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");
const { connectDB } = require("./utils/db");
const {
  getConnection,
  saveConnection,
  saveSchema,
  getSchema,
} = require("./utils/connectionManager");
const {
  generateSQL,
  verifySQL,
  getTableSummary,
} = require("./utils/aiService");
const { pool } = require("mssql");

const app = express();
app.use(cors());
app.use(bodyParser.json());
let currentConfig;
// Public routes
app.use("/auth", authRoutes);

// Protected test route
app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}, you accessed a protected route 🚀`,
  });
});

app.post("/protected/connectDB", authMiddleware, async (req, res) => {
  try {
    const dbConfig = req.body; // { type, host, port, database, username, password, alias }

    // Create connection/pool dynamically
    const pool = await connectDB(dbConfig);
    currentConfig = dbConfig;
    // Save connection for user
    saveConnection(req.user.username, pool);

    // Fetch schema info immediately
    const [tables] = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()"
    );

    const [columns] = await pool.query(
      "SELECT table_name, column_name, data_type, is_nullable, column_key FROM information_schema.columns WHERE table_schema = DATABASE()"
    );

    const [foreignKeys] = await pool.query(`
        SELECT
            kcu.table_name AS table_name,
            kcu.column_name AS column_name,
            kcu.referenced_table_name AS referenced_table,
            kcu.referenced_column_name AS referenced_column
        FROM information_schema.key_column_usage kcu
        WHERE kcu.referenced_table_name IS NOT NULL
          AND kcu.constraint_schema = DATABASE();
    `);

    // Save schema along with the connection so AI can use it later
    saveSchema(req.body.database, {
      tables,
      columns,
      foreignKeys,
    });

    const summary_data = await getTableSummary(tables);
    res.json({
      message: "Database connected successfully!",
      summary: summary_data, // Optional: send schema to frontend if needed
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to connect to database", error: err.message });
  }
});

app.post("/protected/query", authMiddleware, async (req, res) => {
  try {
    if (!currentConfig) {
      return res.status(400).json({ message: "No active DB connection" });
    }

    const { userQuery } = req.body; // frontend only sends the query
    const dbName = currentConfig.database;
    const schema = getSchema(dbName);

    // Step 1: Generate SQL from AI
    const rawSQL = await generateSQL(userQuery, schema);

    // Step 2: Verify SQL with AI
    const verifiedSQL = await verifySQL(rawSQL, schema);

    // Extract the SQL from the ```sql block``` if present
    const match = verifiedSQL.match(/```sql\s*([\s\S]*?)```/i);
    const sqlQuery = match ? match[1].trim() : verifiedSQL.trim();

    // Get the connection pool for the current user
    const pool = getConnection(currentConfig.username);
    if (!pool) {
      return res.status(400).json({ message: "No DB connection for user" });
    }

    // Execute SQL query
    const [result] = await pool.query(sqlQuery);

    res.json({ sql: sqlQuery, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
