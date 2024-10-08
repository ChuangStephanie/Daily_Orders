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

// red font
const redFont = {
  font: {
    color: { argb: "FFFF0000" },
  },
};

// format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const year = date.getFullYear();
  return `${month}${day}${year}`;
};

const continueOrdernum = (sheet, orderNumColIndex) => {
  let lastOrderNum = "";
  sheet.eachRow({ includeEmpty: true }, (row, rowIndex) => {
    if (rowIndex === 1) return;
    const orderNum = row.getCell(orderNumColIndex).value;
    if (orderNum) {
      lastOrderNum = orderNum;
    }
  });
  return lastOrderNum;
};

const location = "ASD-TSL-TX";
const refurb = "检测翻新";
const scrap = "仅检测";
const qty = 1;

// Brand new SKU
const pro6001SKU = "AI00420711001";
const pro6002SKU = "AI00427111001";
const seGraySKU = "AI00419711001";
const seWhiteSKU = "AI00419811001";

workRouter.post("/work-orders", upload.array("files"), async (req, res) => {
  if (!req.files) {
    return res.status(400).send("No file uploaded.");
  }

  const filteredFilePath = path.join(processedDir, "AiperDropshipOrders.xlsx");

  //array of srcap machines, empty if none
  const machines = req.body.machines ? JSON.parse(req.body.machines) : [];
  console.log("Scraps:", machines);

  const inputDate = req.body.inputDate; // Retrieve the custom date
  const formattedDate = formatDate(inputDate) || formatDate(new Date());

  if (!formattedDate) {
    return res.status(400).send("Invalid date format.");
  }

  console.log("Formatted date:", formattedDate);

  const finishDate = inputDate
    ? new Date(inputDate).toLocaleDateString("en-US")
    : new Date().toLocaleDateString("en-US");

  console.log("Finish Date:", finishDate);

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
      for (let i = 1; i <= 3; i++) {
        const headerRow = sheet.getRow(i);
        let colIndex = -1;
        headerRow.eachCell((cell, colNumber) => {
          if (cell.value === headerName) {
            colIndex = colNumber;
          }
        });
        if (colIndex !== -1) return colIndex;
      }
      return -1;
    };

    const modelColIndex = getColIndex(palletSheet, "Model Color");
    const snColIndex = getColIndex(palletSheet, "SN");
    const refurbSkuIndex = getColIndex(palletSheet, "SKU");
    const proOrderNumColIndex = getColIndex(proSheet, "Order Number");
    const seOrderNumColIndex = getColIndex(seSheet, "Order Number");

    console.log(
      "indices:",
      modelColIndex,
      snColIndex,
      proOrderNumColIndex,
      seOrderNumColIndex
    );

    // find values with in rows w matching SN
    const findMatchingSN = (sn, repairSheet, header) => {
      const snColIndex = getColIndex(repairSheet, "S/N");
      const headerColIndex = getColIndex(repairSheet, header);

      for (let i = 4; i <= repairSheet.rowCount; i++) {
        const repairRow = repairSheet.getRow(i);
        const repairSN = repairRow.getCell(snColIndex).value;
        if (repairSN === sn) {
          return repairRow.getCell(headerColIndex).value;
        }
      }
      return null;
    };

    // reformat data
    const cleanData = (value) => {
      if (value != null) {
        return value.toString().trim().toLowerCase();
      }
      return "";
    };

    const insertRepairData = (sn, repairSheet, templateSheet, rowIndex) => {
      const snColIndex = getColIndex(repairSheet, "S/N");

      for (let i = 4; i <= repairSheet.rowCount; i++) {
        const repairRow = repairSheet.getRow(i);
        const repairSN = repairRow.getCell(snColIndex).value;

        // process row if SN matches
        if (repairSN === sn) {
          repairRow.eachCell((cell, colNumber) => {
            const header = cleanData(
              repairSheet.getRow(2).getCell(colNumber).value
            );
            console.log("Header:", header);

            // find matching header/column
            let templateColIndex = -1;
            const templateHeaderRow = templateSheet.getRow(1);
            templateHeaderRow.eachCell((cell, colNumber) => {
              const templateHeader = cleanData(cell.value);
              if (templateHeader === header) {
                templateColIndex = colNumber;
                console.log(`Found matching header: ${templateHeader}`);
              }
            });

            if (templateColIndex !== -1) {
              const templateRow = templateSheet.getRow(rowIndex);
              const partSku = repairSheet.getRow(3).getCell(colNumber).value;

              // insert part SKU
              templateRow.getCell(templateColIndex).value = partSku;

              // insert qty of part
              templateRow.getCell(templateColIndex + 1).value = cell.value;
              const templateHeader = templateSheet
                .getRow(1)
                .getCell(templateColIndex).value;
              console.log(
                `Qty: ${cell.value} and Part SKU: ${partSku} inserted under ${templateHeader}`
              );
            }
          });
          break;
        }
      }
    };

    const proOrders = [];
    const seOrders = [];
    let proRow = 2;
    let seRow = 2;

    palletSheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;
      const model = row.getCell(modelColIndex).value;
      const sn = row.getCell(snColIndex).value;
      const refurbSku = row.getCell(refurbSkuIndex).value;
      console.log("Refurb SKU:", refurbSku);
      let orderNumber;
      let startDate = finishDate;
      let errorCode = null;
      let repairSheet = null;
      let preRefurbSku = null;

      // determine which repair sheet/SKU
      if (model.includes("6001")) {
        repairSheet = pro6001RepairSheet;
        preRefurbSku = pro6001SKU;
      } else if (model.includes("6002")) {
        repairSheet = pro6002RepairSheet;
        preRefurbSku = pro6002SKU;
      } else if (model.includes("SE")) {
        repairSheet = seRepairSheet;
        if (model.includes("Gray")) {
          preRefurbSku = seGraySKU;
        } else {
          preRefurbSku = seWhiteSKU;
        }
      }

      // find start date and error code
      if (repairSheet) {
        const matchedDate = findMatchingSN(sn, repairSheet, "Date");
        if (matchedDate) {
          startDate = new Date(matchedDate).toLocaleDateString("en-US");
          console.log("Start Date:", startDate);
        }
        const matchedError = findMatchingSN(sn, repairSheet, "Problem");
        if (matchedError) {
          errorCode = matchedError;
          console.log("Error Code:", errorCode);
        }
        if (model.includes("Pro")) {
          insertRepairData(sn, repairSheet, proSheet, proRow);
          proRow++;
          console.log("Pro row count:", proRow);
        } else if (model.includes("SE")) {
          insertRepairData(sn, repairSheet, seSheet, seRow);
          seRow++;
          console.log("SE row count:", seRow);
        }
      }

      // generate order number
      if (model.includes("Pro")) {
        orderNumber = `TSLPRO${formattedDate}${proOrders.length + 1}`;
        // log order number
        console.log("Order number:", orderNumber);
        proOrders.push({
          orderNumber,
          startDate,
          preRefurbSku,
          refurbSku,
          errorCode,
        });
      } else if (model.includes("SE")) {
        orderNumber = `TSLSE${formattedDate}${seOrders.length + 1}`;
        // log order number
        console.log("Order number:", orderNumber);
        seOrders.push({
          orderNumber,
          startDate,
          preRefurbSku,
          refurbSku,
          errorCode,
        });
      }
    });

    // add pro orders to pro sheet
    proOrders.forEach(
      (
        { orderNumber, startDate, preRefurbSku, refurbSku, errorCode },
        index
      ) => {
        const row = proSheet.getRow(index + 2);
        row.getCell(proOrderNumColIndex).value = orderNumber;
        row.getCell(proOrderNumColIndex + 1).value = location;
        row.getCell(proOrderNumColIndex + 1).style = redFont;
        row.getCell(proOrderNumColIndex + 3).value = refurb;
        row.getCell(proOrderNumColIndex + 3).style = redFont;
        row.getCell(proOrderNumColIndex + 4).value = preRefurbSku;
        row.getCell(proOrderNumColIndex + 6).value = qty;
        row.getCell(proOrderNumColIndex + 7).value = startDate;
        row.getCell(proOrderNumColIndex + 8).value = finishDate;
        row.getCell(proOrderNumColIndex + 9).value = errorCode;
        row.getCell(proOrderNumColIndex + 10).value = refurbSku;
        row.getCell(proOrderNumColIndex + 12).value = qty;
      }
    );

    // add se orders to se sheet
    seOrders.forEach(
      (
        { orderNumber, startDate, preRefurbSku, refurbSku, errorCode },
        index
      ) => {
        const row = seSheet.getRow(index + 2);
        row.getCell(seOrderNumColIndex).value = orderNumber;
        row.getCell(seOrderNumColIndex + 1).value = location;
        row.getCell(seOrderNumColIndex + 1).style = redFont;
        row.getCell(seOrderNumColIndex + 3).value = refurb;
        row.getCell(seOrderNumColIndex + 3).style = redFont;
        row.getCell(seOrderNumColIndex + 4).value = preRefurbSku;
        row.getCell(seOrderNumColIndex + 6).value = qty;
        row.getCell(seOrderNumColIndex + 7).value = startDate;
        row.getCell(seOrderNumColIndex + 8).value = finishDate;
        row.getCell(seOrderNumColIndex + 9).value = errorCode;
        row.getCell(seOrderNumColIndex + 10).value = refurbSku;
        row.getCell(seOrderNumColIndex + 12).value = qty;
      }
    );

    const totalScrap = machines.length;
    console.log("Total Scrap:", totalScrap);

    if (totalScrap > 0) {
      const proScrapOrders = [];
      const seScrapOrders = [];

      const lastProOrderNum = proOrders.length;
      const lastSeOrderNum = seOrders.length;

        console.log(lastProOrderNum, lastSeOrderNum);

      machines.forEach((scrapMachine, i) => {
        console.log(scrapMachine);
        const isPro = scrapMachine.model.includes("Pro");
        const isSe = scrapMachine.model.includes("SE");
        const qty = scrapMachine.qty;
        const preRefurbSku = isPro
          ? scrapMachine.model.includes("6001")
            ? pro6001SKU
            : pro6002SKU
          : scrapMachine.model.includes("Gray")
          ? seGraySKU
          : seWhiteSKU;

        if (isPro) {
          for (let i = 0; i < qty; i++) {
            const orderNum = `TSLPRO${formattedDate}${
              lastProOrderNum + proScrapOrders.length + 1
            }`;
            console.log(orderNum);
            proScrapOrders.push({
              orderNum,
              startDate: finishDate,
              preRefurbSku,
            });
          }
        } else if (isSe) {
          for (let i = 0; i < qty; i++) {
            const orderNum = `TSLSE${formattedDate}${
              lastSeOrderNum + seScrapOrders.length + 1
            }`;
            console.log(orderNum);
            seScrapOrders.push({
              orderNum,
              startDate: finishDate,
              preRefurbSku,
            });
          }
        }
      });

      proScrapOrders.forEach(({ orderNum, startDate, preRefurbSku }, index) => {
        const row = proSheet.getRow(proOrders.length + index + 2);
        row.getCell(proOrderNumColIndex).value = orderNum;
        row.getCell(proOrderNumColIndex + 1).value = location;
        row.getCell(proOrderNumColIndex + 1).style = redFont;
        row.getCell(proOrderNumColIndex + 3).value = scrap;
        row.getCell(proOrderNumColIndex + 3).style = redFont;
        row.getCell(proOrderNumColIndex + 4).value = preRefurbSku;
        row.getCell(proOrderNumColIndex + 6).value = qty;
        row.getCell(proOrderNumColIndex + 7).value = startDate;
        row.getCell(proOrderNumColIndex + 8).value = finishDate;
      });

      seScrapOrders.forEach(({ orderNum, startDate, preRefurbSku }, index) => {
        const row = seSheet.getRow(seOrders.length + index + 2);
        row.getCell(seOrderNumColIndex).value = orderNum;
        row.getCell(seOrderNumColIndex + 1).value = location;
        row.getCell(seOrderNumColIndex + 1).style = redFont;
        row.getCell(seOrderNumColIndex + 3).value = scrap;
        row.getCell(seOrderNumColIndex + 3).style = redFont;
        row.getCell(seOrderNumColIndex + 4).value = preRefurbSku;
        row.getCell(seOrderNumColIndex + 6).value = qty;
        row.getCell(seOrderNumColIndex + 7).value = startDate;
        row.getCell(seOrderNumColIndex + 8).value = finishDate;
      });
    }

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

      console.log("file sent!");

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
              `Failed to delete file ${filePath}: ${unlinkErr.message}`
            );
          }
          console.log("Temp files deleted.");
        });
      });
    });
  }
});

module.exports = workRouter;
