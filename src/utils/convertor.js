const fs = require("fs").promises;
const xlsx = require("node-xlsx");
const { json2csvAsync } = require("json-2-csv");
const path = require("path");

const parseXlsx = (fileName, inputDir) => xlsx.parse(`${inputDir}/${fileName}`);

const createCsvFile = async (fileName, inputDir, outputDir) => {
  const csvFile = path
    .basename(`${inputDir}/${fileName}`)
    .replace(".xlsx", ".csv");
  await fs.copyFile(`${inputDir}/${fileName}`, `${outputDir}/${csvFile}`);
  await fs.writeFile(`${outputDir}/${csvFile}`, "");
  return csvFile;
};

const writeDataToCsv = async (fileName, data, outputDir) => {
  if (!data.length) return;
  const csvContent = await json2csvAsync(data);
  await fs.writeFile(`${outputDir}/${fileName}`, csvContent);
};

module.exports = {
  parseXlsx,
  createCsvFile,
  writeDataToCsv
};
