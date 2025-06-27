// backend/server.js
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const fetch = require("node-fetch"); // if using Node < 18

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/sanjeevani", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Mongoose Schemas
const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const ChatSchema = new mongoose.Schema({
  userEmail: String,
  messages: Array,
  title: String,
  date: String,
});

const User = mongoose.model("User", UserSchema);
const Chat = mongoose.model("Chat", ChatSchema);

// Sign Up
app.post("/api/signup", async (req, res) => {
  const { email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ msg: "User already exists" });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ email, password: hashed });
  res.json({ msg: "User created" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }
  res.json({ msg: "Login successful", email });
});

// Save chat
app.post("/api/chats", async (req, res) => {
  const { userEmail, messages } = req.body;
  const title = messages[0]?.text?.slice(0, 30) || "Chat";
  const date = new Date().toLocaleString();

  const chat = await Chat.create({ userEmail, messages, title, date });
  res.json(chat);
});

const upload = multer({ dest: "uploads/" });


// Get chats
app.get("/api/chats/:email", async (req, res) => {
  const chats = await Chat.find({ userEmail: req.params.email });
  res.json(chats);
});

// Delete chat
app.delete("/api/chats/:id", async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ msg: "Chat deleted" });
});

app.listen(5000, () => console.log("Server started on http://localhost:5000"));

mongoose.connection.once("open", () => {
  console.log("✅ Connected to MongoDB");
});
