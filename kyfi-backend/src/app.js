const express = require("express");
const cors = require("cors");
const path = require("path");
const { router } = require("./routes/dealer.routes");
const { handleRazorpayWebhook } = require("./controllers/subscription.controller");

const app = express();

app.use(cors());
app.post(
  "/api/subscription/razorpay/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  handleRazorpayWebhook,
);
app.use(express.json({ limit: "25mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", router);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = { app };
