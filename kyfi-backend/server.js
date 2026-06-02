require("dotenv").config();

const { app } = require("./src/app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`KYFI backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start KYFI backend:", error);
  process.exit(1);
});
