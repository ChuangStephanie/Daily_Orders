const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const workRouter = express.Router();
const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");

const upload = multer({ dest: uploadDir });
const templatePath = path.join(__dirname, "db", "templates", "template.xlsx");
console.log(`Template Path: ${templatePath}`)

workRouter.post("/work-orders", upload.array("files"), async (req, res) => {
  if (!req.files) {
    return res.status(400).send("No file uploaded.");
  }

  const filteredFilePath = path.join(processedDir, "AiperDropshipOrders.xlsx");

  const inputDate = req.body.date; // Retrieve the custom date
  const formattedDate = inputDate
    ? inputDate
    : new Date()
        .toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "");

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const proSheet = workbook.getWorksheet("PRO");
    const seSheet = workbook.getWorksheet("SE");

    const palletFile = req.files.find((file) =>
      file.originalname.includes("pallet")
    );
    const repairFile = req.files.find((file) =>
      file.originalname.includes("repair")
    );

    console.log(`Files foumd: ${palletFile}, ${repairFile}`);

    const palletWorkbook = new ExcelJS.Workbook();
    await palletWorkbook.xlsx.readFile(palletFile.path);
    const palletSheet = palletWorkbook.worksheets[0];

    const repairWorkbook = new ExcelJS.Workbook();
    await repairWorkbook.xlsx.readFile(repairFile.path);
    const seRepairSheet = repairWorkbook.worksheets.find((sheet) =>
      sheet.name.includes("SE")
    );
    const pro6001RepairSheet = repairWorkbook.worksheets.find((sheet) =>
      sheet.name.includes("6001")
    );
    const pro6002RepairSheet = repairWorkbook.worksheets.find((sheet) =>
      sheet.name.includes("6002")
    );

    const getColIndex = (sheet, headerName) => {
      const headerRow = sheet.getRow(1);
      let colIndex = -1;
      headerRow.eachCell((cell, colNumber) => {
        if (cell.value === headerName) {
          colIndex = colNumber;
        }
      });
      return colIndex;
    };

    const modelColIndex = getColIndex(palletSheet, "Model");
    const snColIndex = getColIndex(palletSheet, "SN");
    const proOrderNumColIndex = getColIndex(proSheet, "Order Number");
    const seOrderNumColIndex = getColIndex(seSheet, "Order Number");

    const proOrders = [];
    const seOrders = [];

    palletSheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const model = row.getCell(modelColIndex).value;
      const sn = row.getCell(snColIndex).value;

      let orderNumber;

      if (model.includes("pro")) {
        orderNumber = `TSLPRO${formattedDate}${proOrders.length + 1}`;
        proOrders.push(orderNumber);

        proSheet.addRow({
          [proOrderNumColIndex]: orderNumber,
        });
      } else if (model.includes("se")) {
        orderNumber = `TSLSE${formattedDate}${seOrders.length + 1}`;
        seOrders.push(orderNumber);

        seSheet.addRow({
          [seOrderNumColIndex]: orderNumber,
        });
      }
    });

    const date = new Date()
      .toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, ".");

    await workbook.xlsx.writeFile(filteredFilePath);

    // send file as download
    res.download(filteredFilePath, `Work Orders ${date}.xlsx`, (err) => {
      if (err) {
        res.status(500).send(`Error downloading file: ${err.message}`);
      }

      // remove temp file
      fs.unlink(filteredFilePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error(`Failed to delete temp file: ${unlinkErr.message}`);
        }
      });
    });
    res.status(200).send("Files processed successfully.");
  } catch (error) {
    res.status(500).send(`Error processing files: ${error.message}`);
  }
});

module.exports = workRouter;
