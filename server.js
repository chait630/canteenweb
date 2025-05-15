require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const MenuItem = require("./models/MenuItem");
const Order = require("./models/Order");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "canteenSecret",
    resave: false,
    saveUninitialized: false,
  })
);

// ✅ Static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ CSP headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ MongoDB connect
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Multer (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Upload buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "canteen_items" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// ✅ Auth: Register Admin
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return res.status(200).json({ message: "Login successful" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});


// ✅ Middleware: Auth Check
const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  return res.status(401).json({ message: "❌ Unauthorized" });
};

// ✅ GET: Menu
app.get("/api/menu", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ _id: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to load menu items", error: err.message });
  }
});

// ✅ POST: Add item (protected)
app.post("/api/menu", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    const { name, price, category, flavour } = req.body;
    if (!req.file) return res.status(400).json({ message: "❌ No image file uploaded." });

    const uploadResult = await uploadToCloudinary(req.file.buffer);
    const finalCategory = Array.isArray(category) ? category[0] : category;

    const newItem = new MenuItem({
      name,
      price,
      imageUrl: uploadResult.secure_url,
      category: finalCategory,
      flavour: finalCategory === "Snacks" ? flavour : undefined,
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to post item", error: err.message });
  }
});

// ✅ POST: Place order
app.post("/api/orders", async (req, res) => {
  try {
    const { itemName, quantity, totalAmount } = req.body;
    const order = new Order({ itemName, quantity, totalAmount });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to place order", error: err.message });
  }
});

// ✅ GET: Track orders
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "❌ Failed to fetch orders", error: err.message });
  }
});

// ✅ Auto status update every 30s
const statusSequence = ["Placed", "Preparing", "Ready", "Delivered"];

setInterval(async () => {
  console.log("⏱ Checking order statuses...");
  try {
    const orders = await Order.find({ status: { $ne: "Delivered" } });

    for (const order of orders) {
      const currentIndex = statusSequence.indexOf(order.status);
      if (currentIndex < statusSequence.length - 1) {
        order.status = statusSequence[currentIndex + 1];
        await order.save();
        console.log(`✅ Order ${order._id} status updated to: ${order.status}`);
      }
    }
  } catch (err) {
    console.error("❌ Error updating order statuses:", err.message);
  }
}, 30000); // 30 seconds

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
