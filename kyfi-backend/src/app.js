const express = require("express");
const cors = require("cors");
const { router } = require("./routes/dealer.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = { app };
