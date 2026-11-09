const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const MOVEMENTS_FILE = path.join(DATA_DIR, "movements.json");

app.use(cors());
app.use(express.json());

function readJson(file) {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, "[]");
    return JSON.parse(fs.readFileSync(file, "utf8") || "[]");
  } catch (error) {
    console.error(`Unable to read ${file}:`, error);
    return [];
  }
}
function writeJson(file, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function clean(value) {
  return String(value ?? "").trim();
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "WE GO SHOPPING CENTER Inventory API is running" });
});

app.get("/api/products", (req, res) => {
  const q = clean(req.query.search).toLowerCase();
  const category = clean(req.query.category);
  let products = readJson(PRODUCTS_FILE);
  if (q) products = products.filter(p =>
    [p.name, p.code, p.category, p.description].some(v => String(v || "").toLowerCase().includes(q))
  );
  if (category && category !== "All Categories") {
    products = products.filter(p => p.category === category);
  }
  res.json(products.sort((a, b) => a.name.localeCompare(b.name)));
});

app.post("/api/products", (req, res) => {
  const { name, code, category, price, quantity, reorderLevel, description } = req.body;
  if (!clean(name) || !clean(code) || !clean(category)) {
    return res.status(400).json({ message: "Product name, code, and category are required." });
  }
  const products = readJson(PRODUCTS_FILE);
  if (products.some(p => p.code.toLowerCase() === clean(code).toLowerCase())) {
    return res.status(409).json({ message: "A product with this product code already exists." });
  }
  const product = {
    id: makeId(), name: clean(name), code: clean(code), category: clean(category),
    price: Math.max(0, Number(price) || 0), quantity: Math.max(0, Math.floor(Number(quantity) || 0)),
    reorderLevel: Math.max(0, Math.floor(Number(reorderLevel) || 10)),
    description: clean(description), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  products.push(product);
  writeJson(PRODUCTS_FILE, products);
  res.status(201).json(product);
});

app.put("/api/products/:id", (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: "Product not found." });
  const { name, code, category, price, reorderLevel, description } = req.body;
  if (!clean(name) || !clean(code) || !clean(category)) {
    return res.status(400).json({ message: "Product name, code, and category are required." });
  }
  if (products.some((p, i) => i !== index && p.code.toLowerCase() === clean(code).toLowerCase())) {
    return res.status(409).json({ message: "Another product already uses this product code." });
  }
  products[index] = {
    ...products[index], name: clean(name), code: clean(code), category: clean(category),
    price: Math.max(0, Number(price) || 0),
    reorderLevel: Math.max(0, Math.floor(Number(reorderLevel) || 10)),
    description: clean(description), updatedAt: new Date().toISOString()
  };
  writeJson(PRODUCTS_FILE, products);
  res.json(products[index]);
});

app.delete("/api/products/:id", (req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const next = products.filter(p => p.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ message: "Product not found." });
  writeJson(PRODUCTS_FILE, next);
  res.json({ message: "Product deleted successfully." });
});

app.post("/api/movements", (req, res) => {
  const { productId, type, quantity, note } = req.body;
  const amount = Math.floor(Number(quantity));
  if (!productId || !["IN", "OUT"].includes(type) || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: "Select a product, movement type, and a quantity greater than zero." });
  }
  const products = readJson(PRODUCTS_FILE);
  const product = products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: "Product not found." });
  if (type === "OUT" && amount > product.quantity) {
    return res.status(400).json({ message: `Insufficient stock. Only ${product.quantity} unit(s) available.` });
  }
  product.quantity += type === "IN" ? amount : -amount;
  product.updatedAt = new Date().toISOString();
  writeJson(PRODUCTS_FILE, products);

  const movements = readJson(MOVEMENTS_FILE);
  const movement = {
    id: makeId(), productId, productName: product.name, productCode: product.code,
    category: product.category, type, quantity: amount, note: clean(note),
    balanceAfter: product.quantity, createdAt: new Date().toISOString()
  };
  movements.unshift(movement);
  writeJson(MOVEMENTS_FILE, movements);
  res.status(201).json({ movement, product });
});

app.get("/api/movements", (req, res) => {
  const q = clean(req.query.search).toLowerCase();
  let movements = readJson(MOVEMENTS_FILE);
  if (q) movements = movements.filter(m =>
    [m.productName, m.productCode, m.category, m.type, m.note].some(v => String(v || "").toLowerCase().includes(q))
  );
  res.json(movements);
});

app.get("/api/dashboard", (_req, res) => {
  const products = readJson(PRODUCTS_FILE);
  const movements = readJson(MOVEMENTS_FILE);
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter(p => p.quantity <= p.reorderLevel);
  const categorySummary = ["Canned Goods", "Noodles", "Frozen Goods"].map(category => {
    const items = products.filter(p => p.category === category);
    return { category, products: items.length, units: items.reduce((sum, p) => sum + p.quantity, 0) };
  });
  res.json({
    totalProducts: products.length, totalUnits, lowStockCount: lowStock.length,
    inventoryValue: products.reduce((sum, p) => sum + p.price * p.quantity, 0),
    lowStock, categorySummary, recentMovements: movements.slice(0, 6)
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error. Please try again." });
});

app.listen(PORT, () => console.log(`Inventory API running at http://localhost:${PORT}`));