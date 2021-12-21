const fs = require("fs");
const xlsx = require("node-xlsx");
const convertor = require("json-2-csv");
const path = require("path");
const { type } = require("express/lib/response");

// Make sure to modify the xlsx file to have the following columns:
// add a new column with Yes on each row you'd like to be writing into the new csv file
// client name
// item name
// item description
// billing rate

let worksheet;
const inputPath = `${__dirname}/../../input`;
const outputPath = `${__dirname}/../../output`;

const parseXlsx = fileName => {
  return (worksheet = xlsx.parse(`${inputPath}/${fileName}`));
};

const createCsvFile = fileName => {
  // change file extension to .csv
  const csvFile = path
    .basename(`${inputPath}/${fileName}`)
    .replace(".xlsx", ".csv");
  fs.copyFile(`${inputPath}/${fileName}`, `${outputPath}/${csvFile}`, err => {
    if (err) throw err;
    fs.writeFile(`${outputPath}/${csvFile}`, "", err => {
      if (err) throw err;
    });
  });
  return csvFile;
};

const createDataToWrite = (worksheet, nextInvoiceNumber, date) => {
  let dataToWrite = [];
  let dateString = new Date(date).toLocaleDateString();
  console.log(typeof dateString);
  for (const sheet of worksheet) {
    sheet.data.forEach((row, index) => {
      if (row[0] === "Yes") {
        const data = {
          "*InvoiceNo": +nextInvoiceNumber + 1,
          "*Customer": row[2],
          "*InvoiceDate": dateString,
          "*DueDate": dateString,
          Terms: "Due on Receipt",
          Location: "",
          Memo: "",
          "Item(Product/Service)": row[3],
          ItemDescription: row[4],
          ItemQuantity: row[5],
          ItemRate: row[7],
          "*ItemAmount": row[5] * row[7],
          ItemTaxAmount: 0
        };
        dataToWrite.push(data);
        nextInvoiceNumber++;
      }
    });
  }
  console.log("Creating data to write done....");
  return dataToWrite;
};

const writeDataToCsv = (fileName, data) => {
  convertor.json2csv(data, (err, csvContent) => {
    if (err) throw err;
    fs.writeFile(`${outputPath}/${fileName}`, csvContent, err => {
      if (err) throw err;
    });
    console.log("Writing data to CSV file done....");
  });
};

module.exports = {
  parseXlsx,
  createCsvFile,
  createDataToWrite,
  writeDataToCsv
};
