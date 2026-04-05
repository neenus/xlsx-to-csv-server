const path = require("path");
const { parseXlsx, createCsvFile, writeDataToCsv } = require("../utils/convertor");
const { createDataToWrite } = require("./conversion.service");

const runConversionJob = async ({
  file,
  inputDir,
  outputDir,
  uniqueFileName,
  nextInvoiceNumber,
  date,
  columnMapping
}) => {
  const inputPath = path.join(inputDir, uniqueFileName);
  await file.mv(inputPath);

  const worksheet = parseXlsx(uniqueFileName, inputDir);
  const csvFile = await createCsvFile(uniqueFileName, inputDir, outputDir);
  const rows = await createDataToWrite(worksheet, nextInvoiceNumber, date, columnMapping);
  await writeDataToCsv(csvFile, rows, outputDir);

  return { csvFile, rows };
};

module.exports = { runConversionJob };
