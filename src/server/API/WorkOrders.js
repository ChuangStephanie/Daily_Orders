const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const workRouter = express.Router();
const uploadDir = path.join(__dirname, "..", "db", "uploads");

const upload = multer({ dest: uploadDir });
const templatePath = path.join(__dirname, "db", "templates", "template.xlsx");

workRouter.post("/work-orders", upload.array("files"), async (req, res) => {
  if (!req.files) {
    return res.status(400).send("No file uploaded.");
  }

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

    const proOrders = [];
    const seOrders = [];

    palletSheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const model = row.getCell("Model").value;
      const sn = row.getCell("SN").value;

      let orderNumber;

      if (model.includes("pro")) {
        orderNumber = `TSLPRO${formattedDate}${proOrders.length + 1}`;
        proOrders.push(orderNumber);
        proSheet.addRow([orderNumber]);
      }
    });
  } catch (error) {}
});
