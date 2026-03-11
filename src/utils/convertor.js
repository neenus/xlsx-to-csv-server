const fs = require("fs");
const xlsx = require("node-xlsx");
const convertor = require("json-2-csv");
const path = require("path");

const parseXlsx = (fileName, inputDir) => xlsx.parse(`${inputDir}/${fileName}`);

const createCsvFile = (fileName, inputDir, outputDir) => {
  const csvFile = path
    .basename(`${inputDir}/${fileName}`)
    .replace(".xlsx", ".csv");
  fs.copyFile(`${inputDir}/${fileName}`, `${outputDir}/${csvFile}`, async err => {
    if (err) throw err;
    await fs.writeFile(`${outputDir}/${csvFile}`, "", err => {
      if (err) throw err;
    });
  });
  return csvFile;
};

const writeDataToCsv = async (fileName, data, outputDir) => {
  if (!data.length) {
    return;
  };
  convertor.json2csv(data, (err, csvContent) => {
    if (err) throw err;
    fs.writeFile(`${outputDir}/${fileName}`, csvContent, err => {
      if (err) throw err;
    });
  });
};

module.exports = {
  parseXlsx,
  createCsvFile,
  writeDataToCsv
};
