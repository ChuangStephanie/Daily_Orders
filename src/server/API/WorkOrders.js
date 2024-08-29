const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const workRouter = express.Router();
const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");

const upload = multer({ dest: uploadDir });
const templatePath = path.join(
  __dirname,
  "..",
  "db",
  "templates",
  "template.xlsx"
);
console.log(`Template Path: ${templatePath}`);

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
      file.originalname.includes("Pallet")
    );
    const repairFile = req.files.find((file) =>
      file.originalname.includes("Repair")
    );

    console.log(`Files found: ${palletFile}, ${repairFile}`);

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

    console.log(
      "indices:",
      modelColIndex,
      snColIndex,
      proOrderNumColIndex,
      seOrderNumColIndex
    );

    const proOrders = [];
    const seOrders = [];

    palletSheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const model = row.getCell(modelColIndex).value;
      const sn = row.getCell(snColIndex).value;

      let orderNumber;

      if (model.includes("Pro")) {
        orderNumber = `TSLPRO${formattedDate}${proOrders.length + 1}`;
        // log order number
        console.log("Order number:", orderNumber);
        proOrders.push(orderNumber);
      } else if (model.includes("SE")) {
        orderNumber = `TSLSE${formattedDate}${seOrders.length + 1}`;
        // log order number
        console.log("Order number:", orderNumber);
        seOrders.push(orderNumber);
      }
    });

    // add pro orders to pro sheet
    proOrders.forEach((orderNumber, index) => {
      const row = proSheet.getRow(index + 2);
      row.getCell(proOrderNumColIndex).value = orderNumber;
    });

    // add se orders to se sheet
    seOrders.forEach((orderNumber, index) => {
      const row = seSheet.getRow(index + 2);
      row.getCell(seOrderNumColIndex).value = orderNumber;
    });

    console.log("PRO Sheet Content:", proSheet.getSheetValues());
    console.log("SE Sheet Content:", seSheet.getSheetValues());

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
  } catch (error) {
    res.status(500).send(`Error processing files: ${error.message}`);
  } finally {
    // cleanup
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error(`Failed to read directory: ${err.message}`);
        return;
      }
      files.forEach((file) => {
        const filePath = path.join(uploadDir, file);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(
              `Failed to delete file ${filePath}: ${fs.unlinkErr.message}`
            );
          }
          console.log("Temp files deleted.");
        });
      });
    });
  }
});

module.exports = workRouter;
