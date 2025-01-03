const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");
const upload = multer({ dest: uploadDir });
const machineSearchTerm = "机";
const partSearchTerm = "配件";

const outboundProcess = async (outboundRows) => {
  try {
    const outboundPath = path.join(
      __dirname,
      "..",
      "db",
      "templates",
      "Outbound.xlsx"
    );
    // static info (doesn't change)
    const srcLoc = "1215/Stock";
    const destLoc = "Partners/Customers";
    const status = "Todo";
    const opType = "Techcess Solutions 1215: Outbound Orders";
    const dbID = "1";
    const date = new Date().toISOString().split("T")[0];

    // template file
    const outboundWorkbook = new ExcelJS.Workbook();
    await outboundWorkbook.xlsx.readFile(outboundPath);
    const outboundWorksheet = outboundWorkbook.getWorksheet(1);
    const outboundHeaderRow = outboundWorksheet.getRow(1);

    const machineOutbound = new ExcelJS.Workbook();
    const partsOutbound = new ExcelJS.Workbook();

    const machineSheet = machineOutbound.addWorksheet("Machine");
    const partsSheet = partsOutbound.addWorksheet("Parts");
    machineSheet.addRow(outboundHeaderRow.values);
    partsSheet.addRow(outboundHeaderRow.values);

    outboundRows.forEach((row) => {
      const orderNum = row[0];
      const trackingNum = row[1];
      const carrier = row[2];
      const sku1 = row[3];
      const machineColName = row[4];
      const quantity = row[5];
      const addressee = row[6];
      const state = row[7];
      const city = row[8];
      const street1 = row[9];
      const street2 = row[10];
      const zipCode = row[11];

      let orgCarrier;
      if (carrier == "FEDEX_GROUND") {
        orgCarrier = "FedEx Ground";
      } else if ( carrier == "USPS_CJ") {
        orgCarrier = "USPS Priority Mail";
      }
      
      const isMachine = machineColName
        .toLowerCase()
        .includes(machineSearchTerm.toLowerCase());
      const isPart = machineColName
        .toLowerCase()
        .includes(partSearchTerm.toLowerCase());
      const exclude =
        machineColName.includes("带配件") || machineColName.includes("无配件");
      const stockRef = `${trackingNum}${sku1}`;      

      const newRow = [
        orderNum,
        orderNum,
        srcLoc,
        destLoc,
        date,
        status,
        opType,
        trackingNum,
        quantity,
        srcLoc,
        destLoc,
        stockRef,
        sku1,
        orgCarrier,
        dbID,
        street1,
        street2 || "",
        city,
        state,
        zipCode,
        addressee,
        ""
      ];

      if (isMachine && isPart && !exclude) {
        partsSheet.addRow(newRow);
      } else if (isMachine) {
        machineSheet.addRow(newRow);
      } else {
        partsSheet.addRow(newRow);
      }
    });

    const machineFilePath = path.join(processedDir, "OutboundTransferMachine.xlsx");
    const partsFilePath = path.join(processedDir, "OutboundTransferParts.xlsx");

    await machineOutbound.xlsx.writeFile(machineFilePath);
    console.log("machine saved")
    await partsOutbound.xlsx.writeFile(partsFilePath);
    console.log("parts saved")

    console.log("Machine Odoo:", machineFilePath);
    console.log("Parts Odoo:", partsFilePath);
  } catch (error) {
    console.error("Error processing outbound data:", error);
  }
};

module.exports = outboundProcess;