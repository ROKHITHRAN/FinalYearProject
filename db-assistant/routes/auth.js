const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();

// In-memory user store (replace with DB later)
const users = [];

// Register new user
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // Check if user exists
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });

  res.json({ message: "User registered successfully" });
});

// Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(400).json({ message: "Invalid credentials" });

  // Create JWT
  const token = jwt.sign({ username }, process.env.JWT_SECRET || "secretkey", {
    expiresIn: "1h",
  });

  res.json({ token });
});

module.exports = router;
