const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uploadRouter = express.Router();
const processedOrders = require("./UploadProcessed").processedOrders;

const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");
console.log("Directory path:", uploadDir, "Processed path:", processedDir);

const upload = multer({ dest: uploadDir });

const columnName = "物流状态";
const searchTerm = "暂未上线";
const includeBlanks = true;
const machineColName = "品名";
const machineSearchTerm = "新机";
const trackingNum = "跟踪号";
const orderNum = "发货单号";
const quantity = "发货数量";
const createTime = "创建时间";

// columns to keep
const retainColumns = [
  orderNum,
  trackingNum,
  "SKU1",
  "Category",
  machineColName,
  quantity,
  createTime,
];

// route for file uploads and filtering
uploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("Uploaded file details:", req.file);

  const filePath = req.file.path;
  const filteredFilePath = path.join(processedDir, "AiperDropshipOrders.xlsx");

  // clear old files in processed folder
  const clearProcessedDir = () => {
    fs.readdir(processedDir, (err, files) => {
      if (err) {
        console.err("Error reading processed dir:", err);
        return;
      }

      files.forEach((file) => {
        const filePath = path.join(processedDir, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("Error deleting file:", err);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      });
    });
  };

  clearProcessedDir();

  try {
    // load uploaded excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // get inital worksheet
    const worksheet = workbook.getWorksheet(1);

    // find column index based on names
    const headerRow = worksheet.getRow(1);
    const colIndices = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      colIndices[cell.value] = colNumber;
    });

    const columnIndex = colIndices[columnName];
    const skuIndex = colIndices["SKU1"];
    const sku2Index = colIndices["SKU2"];
    const sku3Index = colIndices["SKU3"];
    const sku4Index = colIndices["SKU4"];
    const trackingNumIndex = colIndices[trackingNum];
    const orderNumIndex = colIndices[orderNum];
    const createTimeIndex = colIndices[createTime];

    if (columnIndex === undefined || trackingNumIndex === undefined) {
      return res.status(400).send("Column not found");
    }

    if (
      sku2Index === undefined ||
      sku3Index === undefined ||
      sku4Index === undefined
    ) {
      return res.status(400).send("SKU columns not found");
    }

    // filter rows based on search term
    const filteredRows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellValue = row.getCell(columnIndex).value;
      const trackingNumber = row.getCell(trackingNumIndex).value;

      // filter logic
      if (
        (includeBlanks && (cellValue === null || cellValue === undefined)) ||
        (cellValue &&
          cellValue.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        if (
          trackingNumber &&
          processedOrders.has(trackingNumber.toString().trim())
        ) {
          console.log("Skip row with processed tracking num:", trackingNumber);
          return;
        }

        // get SKU index
        const skus = [
          { sku: "SKU1", skuValue: row.getCell(skuIndex).value },
          { sku: "SKU2", skuValue: row.getCell(sku2Index).value },
          { sku: "SKU3", skuValue: row.getCell(sku3Index).value },
          { sku: "SKU4", skuValue: row.getCell(sku4Index).value },
        ];

        let addedOriginalRow = false;

        skus.forEach((skuData, i) => {
          if (skuData.skuValue) {
            const currentSKUIndex = colIndices[skuData.sku];
            const currentItemIndex = currentSKUIndex + 1;
            const currentQtyIndex = currentSKUIndex + 2;

            const newRow = {
              [orderNum]: row.getCell(orderNumIndex).value,
              [trackingNum]: row.getCell(trackingNumIndex).value,
              ["SKU1"]: skuData.skuValue,
              [machineColName]: row.getCell(currentItemIndex).value,
              [quantity]: row.getCell(currentQtyIndex).value,
              [createTime]: row.getCell(createTimeIndex).value,
            };

            if (i === 0 && !skus.slice(1).some((sku) => sku.skuValue)) {
              // push whole row if only SKU1 has data
              filteredRows.push(retainColumns.map((col) => newRow[col] || ""));
              console.log("Order has 1 item:", row.values);
            } else if (skuData.sku !== "SKU1") {
              // only push specific columns if SKU2/3/4 exist
              filteredRows.push(retainColumns.map((col) => newRow[col] || ""));
              console.log("SKU2+:", newRow);
            } else if (!addedOriginalRow) {
              // add original row w SKU1 if needed
              filteredRows.push(retainColumns.map((col) => newRow[col] || ""));
              addedOriginalRow = true;
            }
          }
        });
      }
    });

    // create orders today sheet
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      const month = `0${date.getMonth() + 1}`.slice(-2);
      const day = `0${date.getDate()}`.slice(-2);
      return `${month}${day}`;
    };
    const ordersWorksheet = workbook.addWorksheet(`${formatDate(new Date())}`);
    ordersWorksheet.addRow(retainColumns);
    filteredRows.forEach((row) => ordersWorksheet.addRow(row));

    // create machine and parts sheets
    const machineSheet = workbook.addWorksheet("Machine");
    const partsSheet = workbook.addWorksheet("Parts");

    machineSheet.addRow(retainColumns);
    partsSheet.addRow(retainColumns);

    // find column index for machine column
    let machineColIndex = -1;
    ordersWorksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value === machineColName && machineColIndex === -1) {
        machineColIndex = colNumber;
      }
    });

    if (machineColIndex === -1) {
      return res.status(400).send("Machine column not found.");
    }

    // update category column to machine or part
    const categoryColIndex = retainColumns.indexOf("Category") + 1;

    ordersWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const machineValue = row.getCell(machineColIndex).value;
      console.log("Machine Value:", machineValue);

      const category =
        machineValue &&
        machineValue
          .toString()
          .toLowerCase()
          .includes(machineSearchTerm.toLowerCase())
          ? "Machine"
          : "Part";

      row.getCell(categoryColIndex).value = category;
      console.log(
        `Row ${rowNumber}: Machine Value: ${machineValue}, Category: ${category}`
      );
    });

    // filter rows for machine and parts sheets
    ordersWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const category = row.getCell(categoryColIndex).value;

      if (category === "Machine") {
        console.log("Added to Machine Sheet");
        machineSheet.addRow(row.values);
      } else {
        console.log("Added to Parts Sheet");
        partsSheet.addRow(row.values);
      }
    });

    // save final file
    try {
      console.log(`Attempting to save new file to: ${filteredFilePath}`);
      await workbook.xlsx.writeFile(filteredFilePath);
      console.log("File saved status:", fs.existsSync(filteredFilePath));
    } catch (error) {
      console.error("Error writing file:", error);
      return res.status(500).send("Failed to save filtered file");
    }
    // check if file saved
    if (!fs.existsSync(filteredFilePath)) {
      console.error("New file not saved correctly.");
      return res.status(500).send("Failed to save filterd file.");
    }

    // send new file
    res.download(filteredFilePath, "AiperDropshipOrderDetails.xlsx", (err) => {
      if (err) {
        console.log("Error sending file:", err);
        res.status(500).send("Failed to send file.");
      }
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).send("Failed to process Excel file.");
  } finally {
    // clean up temp files
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

module.exports = uploadRouter;
