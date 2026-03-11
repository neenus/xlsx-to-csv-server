const request = require("supertest");
const fs = require("fs");
const csv = require("csvtojson");
const convertor = require("./convertor");
const { createDataToWrite } = require("../services/conversion.service");
const { connectDB, closeDB } = require("../config/db");

const testFilesDir = `${__dirname}/../test_files`;
const finalTestFileName = `final_billing_test_sheet.xlsx`;
const proposedTestFileName = `proposed_billing_test_sheet.xlsx`
const outputDir = `${__dirname}/../../storage/output`;


describe("Test convertor module", () => {

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  test("convertor module should be defined", () => expect(convertor).toBeDefined());

  test("convertor module should export an object with the correct keys", () => {
    expect(Object.keys(convertor).length).toBe(3);
    expect(convertor).toEqual(expect.objectContaining({
      parseXlsx: expect.any(Function),
      createCsvFile: expect.any(Function),
      writeDataToCsv: expect.any(Function)
    }));
  });

  test("parseXlsx function should return parsed xls/xlsx as an array of objects", () => {
    const result = convertor.parseXlsx(finalTestFileName, testFilesDir);
    expect(result).toEqual(expect.any(Array));
  });

  test("createCsvFile function should create a csv file in the output directory with the same name", async () => {
    const response = await convertor.createCsvFile(finalTestFileName, testFilesDir, outputDir);
    const files = fs.readdirSync(outputDir);
    const fileExists = files.some(file => file.includes(response));
    expect(fileExists).toBe(true);
  });

  test("createDataToWrite should return an array of objects with the correct keys", async () => {
    const finalWorksheet = await convertor.parseXlsx(finalTestFileName, testFilesDir);
    const proposedWorkSheet = await convertor.parseXlsx(proposedTestFileName, testFilesDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const resultObjectKeys = [
      "*InvoiceNo",
      "*Customer",
      "*InvoiceDate",
      "*DueDate",
      "Terms",
      "Location",
      "Memo",
      "Item(Product/Service)",
      "ItemDescription",
      "ItemQuantity",
      "ItemRate",
      "*ItemAmount",
      "ItemTaxAmount"
    ]
    const finalSheetResult = await createDataToWrite(finalWorksheet, nextInvoiceNumber, date, type = "final");
    const proposedSheetResult = await createDataToWrite(proposedWorkSheet, nextInvoiceNumber, date, type = "proposed");
    expect(finalSheetResult).toEqual(expect.any(Array));
    expect(proposedSheetResult).toEqual(expect.any(Array));

    if (type === "proposed") {
      const keys = Object.keys(proposedSheetResult[0]);
      expect(keys).toEqual(resultObjectKeys);
    } else if (type === "final") {
      const keys = Object.keys(finalSheetResult[0]);
      expect(keys).toEqual(resultObjectKeys);
    } else {
      expect(finalSheetResult || proposedSheetResult).toEqual(null);
    }

  });

  test("createDataToWrite function should not return an empty array", async () => {
    const worksheet = convertor.parseXlsx(finalTestFileName, testFilesDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const result = await createDataToWrite(worksheet, nextInvoiceNumber, date, "final");
    expect(result).not.toEqual([]);
  });

  test("writeDataToCsv function should write data to a csv file", async () => {
    const worksheet = await convertor.parseXlsx(finalTestFileName, testFilesDir);
    const csvFile = await convertor.createCsvFile(finalTestFileName, testFilesDir, outputDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const type = "final"
    const data = await createDataToWrite(worksheet, nextInvoiceNumber, date, type);
    await convertor.writeDataToCsv(csvFile, data, outputDir);


    // check if data written to csv file is the same as the data returned from createDataToWrite function
    const csvFilePath = `${outputDir}/${csvFile}`;
    const dataFromCsvFile = await csv().fromFile(csvFilePath);
    expect(data).toEqual(dataFromCsvFile);
  });
});
