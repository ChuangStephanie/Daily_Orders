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
  const { columnName, searchTerm } = req.body;

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
    worksheet.eachRow({ includeEmpty: false}, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const cellValue = row.getCell(columnIndex).value;
        if (cellValue && cellValue.toString().includes(searchTerm)) {
            filteredRows.push(row.value);
        }
    });

    

  }
});
