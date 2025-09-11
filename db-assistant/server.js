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
} = require("./utils/connectionManager");
const { generateSQL, verifySQL } = require("./utils/aiService");

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

    res.json({
      message: "Database connected successfully!",
      schema: { tables, columns, foreignKeys }, // Optional: send schema to frontend if needed
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
    if (!activePool) {
      return res.status(400).json({ message: "No active DB connection" });
    }

    const { userQuery, schema } = req.body; // frontend sends schema + user question

    // Step 1: Generate SQL from AI
    const rawSQL = await generateSQL(userQuery, schema);

    // Step 2: Verify SQL with AI
    const verifiedSQL = await verifySQL(rawSQL, schema);

    res.json({ sql: verifiedSQL });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
