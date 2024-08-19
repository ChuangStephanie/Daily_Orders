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

// route for file uploads and filtering
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  console.log("Uploaded file details:", req.file);

  const filePath = req.file.path;
  const { columnName, searchTerm, includeBlanks: includeBlanksStr } = req.body;
  const includeBlanks = includeBlanksStr === "true";

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

    try {
      // save new excel file
      console.log(`Attempting to save new file to: ${filteredFilePath}`);
      await newWorkbook.xlsx.writeFile(filteredFilePath);
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
