const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const authMiddleware = require("./middleware/authMiddleware");

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
