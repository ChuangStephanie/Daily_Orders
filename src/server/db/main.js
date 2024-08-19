const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const uploadDir = path.join(__dirname, "uploads");
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json());

// route for file uploads and filtering
app.post("/upload", upload.single("file"), async (req, res) => {
  const filePath = req.file.path;
  const { columnName, searchTerm, includeBlanks } = req.body;

  try {
    // load uploaded excel file
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // get first worksheet
    const worksheet = workbook.getWorksheet(1);

    // find column index based on column name
    let columnIndex = -1;
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      if (cell.value === columnName) {
        columnIndex = colNumber;
      }
    });

    if (columnIndex === -1) {
      return res.status(400).send("Column not found");
    }

    // filter rows based on search term
    const filteredRows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellValue = row.getCell(columnIndex).value;

      // filter logic
      if (
        (includeBlanks && (cellValue === null || cellValue === undefined)) || // will inlcude blanks if requested
        (cellValue &&
          cellValue.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        filteredRows.push(row.values);
      }
    });

    // new workbook w filtered data
    const newWorkbook = new ExcelJS.Workbook();
    const newWorksheet = newWorkbook.addWorksheet("Orders Today");

    // add header row
    newWorksheet.addRow(worksheet.getRow(1).values);

    // add filtered rows
    filteredRows.forEach((row) => newWorksheet.addRow(row));

    // save new excel file
    const filteredFilePath = path.join(__dirname, "AiperDropshipOrders.xlsx");
    await newWorkbook.xlsx.writeFile(filteredFilePath);

    // send new file
    res.download(filteredFilePath, "AiperDropshipOrders.xlsx", (err) => {
      if (err) console.log("Error sending file:", err);
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).send("Failed to process Excel file.");
  } finally {
    // clean up temp files
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (fs.existsSync(filteredFilePath)) fs.unlinkSync(filteredFilePath);
  }
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
