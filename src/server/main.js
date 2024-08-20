const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const uploadDir = path.join(__dirname, "db", "uploads");
const processedDir = path.join(__dirname, "db", "processed");
console.log("Directory path:", uploadDir, "Processed path:", processedDir);
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// check if dir exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

const columnName = "物流状态";
const searchTerm = "暂未上线";
const includeBlanks = true;
const machineColName = "品名";
const machineSearchTerm = "新机";
const trackingNum = "跟踪号"

let processedOrders = new Set();

app.post("/upload-processed", upload.single("file"), async (req, res) => {
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

    // Find column index for 'processed'  
    headerRow.eachCell({includeEmpty: false}, (cell, colNumber)=> {
      if (cell.value === "Processed") {
        processedColIndex = colNumber;
      }
    })

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

    res.send("Processed file data loaded successfully.");
  } catch (error) {
    console.error("Error processing second Excel file:", error);
    res.status(500).send("Failed to process second Excel file.");
  } finally {
    // Clean up temp files
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
});

// route for file uploads and filtering
app.post("/upload", upload.single("file"), async (req, res) => {
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

        if (trackingNumber && processedOrders.has(trackingNumber.toString().trim())) {
          console.log("Skip row with processed tracking num:", trackingNumber);
          return;
        }

        // dupe rows based on if there are SKU2+
        const sku = row.getCell(skuIndex).value;
        const sku2 = row.getCell(sku2Index).value;
        const sku3 = row.getCell(sku3Index).value;
        const sku4 = row.getCell(sku4Index).value;

        const skuCount = [sku, sku2, sku3, sku4].filter((sku) => sku).length;

        for (let i = 0; i < skuCount; i++) {
          filteredRows.push(row.values);
        }
      }
    });

    // create orders today sheet
    const ordersWorksheet = workbook.addWorksheet("Orders Today");

    // add header row
    ordersWorksheet.addRow(headerRow.values);

    // add filtered rows
    filteredRows.forEach((row) => ordersWorksheet.addRow(row));

    // create machine and parts sheets
    const machineSheet = workbook.addWorksheet("Machine");
    const partsSheet = workbook.addWorksheet("Parts");

    // copy header row to machine and parts sheets
    machineSheet.addRow(ordersWorksheet.getRow(1).values);
    partsSheet.addRow(ordersWorksheet.getRow(1).values);

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

    // filter rows for machine and parts sheets
    ordersWorksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellValue = row.getCell(machineColIndex).value;
      console.log("Cell Value:", cellValue);

      if (
        cellValue &&
        cellValue
          .toString()
          .toLowerCase()
          .includes(machineSearchTerm.toLowerCase())
      ) {
        console.log("Added row to machine sheet:", row.values);
        machineSheet.addRow(row.values);
      } else {
        console.log("Added row to parts sheet:", row.values);
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
    res.download(filteredFilePath, "AiperDropshipOrders.xlsx", (err) => {
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

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
