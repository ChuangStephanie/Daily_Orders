const express = require("express");
const ExcelJS = require("exceljs");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "db", "uploads");
const processedDir = path.join(__dirname, "..", "db", "processed");
const upload = multer({ dest: uploadDir });
const outboundPath = path.join(
  __dirname,
  "..",
  "db",
  "templates",
  "Outbound.xlsx"
);

const columnName = "物流状态";
const searchTerm = "暂未上线";
const includeBlanks = true;
const machineColName = "品名";
const machineSearchTerm = "机";
const partSearchTerm = "配件";
const trackingNum = "跟踪号";
const orderNum = "发货单号";
const quantity = "发货数量";
const createTime = "创建时间";

const addressee = "收件人姓名";
const state = "省份";
const city = "市区";
const street1 = "收件人地址1";
const street2 = "收件人地址2";
const zip = "邮编";

const outboundImport = async (inpuFilePath, outputFilePath, retainOutbound) => {
  try {
    // template file
    const outboundWorkbook = new ExcelJS.Workbook();
    await outboundWorkbook.xlsx.readFile(outboundPath);
    const outboundWorksheet = outboundWorkbook.getWorksheet(1);
    const outboundHeaderRow = outboundWorksheet.getRow(1);

    const machineOutbound = new ExcelJS.Workbook();
    const partsOutbound = new ExcelJS.Workbook();
 

  } catch (error) {}
};
