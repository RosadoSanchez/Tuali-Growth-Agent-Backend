require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// routes
app.use("/api/orders", require("./routes/orders"));

app.use("/api/order-details", require("./routes/orderDetails"));

app.use("/api/analytics", require("./routes/analytics"));

app.use("/api/customers", require("./routes/customers"));

app.use("/api/whatsapp", require("./routes/whatsapp"));

app.use(
  "/api/agent",
  require("./routes/agent")
);

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});