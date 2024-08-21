const express = require("express");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const processedRouter = express.Router();
const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedOrders = new Set();

// Multer configuration for file uploads
const multer = require("multer");
const upload = multer({ dest: uploadDir });

processedRouter.post(
  "/upload-processed",
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const filePath = req.file.path;

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);

      const worksheet = workbook.getWorksheet(2);
      const headerRow = worksheet.getRow(1);
      let processedColIndex = -1;

      // clear old processed orders
      processedOrders.clear();
      console.log("Set cleared");

      // Find column index for 'processed'
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        if (cell.value === "Processed") {
          processedColIndex = colNumber;
        }
      });

      if (processedColIndex === -1) {
        return res.status(400).send("Processed column not found.");
      }

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const processedValue = row.getCell(processedColIndex).value;
        if (processedValue) {
          processedOrders.add(processedValue.toString().trim());
        }
      });
      console.log("Processed Orders:", processedOrders);
      res.send("Processed file data loaded successfully.");
    } catch (error) {
      console.error("Error processing second Excel file:", error);
      res.status(500).send("Failed to process second Excel file.");
    } finally {
      // Clean up temp files
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
);

module.exports = { 
  router: processedRouter,
  processedOrders
 };