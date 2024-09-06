const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const processedRouter = require("./API/UploadProcessed").router;
const uploadRouter = require("./API/Upload");
const workRouter = require("./API/WorkOrders");

const app = express();
app.use(
  cors({
    origin: "https://daily-orders.netlify.app/",
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");
// check if dir exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

// Routes
app.use("/api", processedRouter);
app.use("/api", uploadRouter);
app.use("/api", workRouter);

// start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
