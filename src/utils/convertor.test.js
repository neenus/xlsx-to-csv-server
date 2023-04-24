const request = require("supertest");
const fs = require("fs");
const csv = require("csvtojson");
const convertor = require("./convertor");

const testFilesDir = `${__dirname}/../test_files`;
const finalTestFileName = `Taylor Proposed March 2022.xlsx`;
const proposedTestFileName = `proposed_billing_test_sheet.xlsx`
const outputDir = `${__dirname}/../../storage/output`;


describe("Test convertor module", () => {

  test("convertor module should be defined", () => expect(convertor).toBeDefined());

  test("convertor module should export an object with the correct keys", () => {
    // check if the object has 6 keys since there are 6 functions
    expect(Object.keys(convertor).length).toBe(7);
    // check if the object has the correct keys
    expect(convertor).toEqual(expect.objectContaining({
      parseXlsx: expect.any(Function),
      createCsvFile: expect.any(Function),
      createDataToWrite: expect.any(Function),
      writeDataToCsv: expect.any(Function),
      getServiceBillingRate: expect.any(Function),
      setServiceName: expect.any(Function),
      getRowData: expect.any(Function)
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

  test("getServiceBillingRate function should return the service billing rate", () => {
    const service = "Academic Strategist";
    const level = "postsecondary";
    const result = convertor.getServiceBillingRate(service, level);
    expect(result).toEqual(85.00);
  });

  test("setServiceName function should return the service name", () => {
    const service = "Academic Strategist";
    const result = convertor.setServiceName(service);
    expect(result).toEqual("Academic Strategist");
  });

  test("getRowData function should return an object with the correct keys", () => {
    const row = ['Lisa Marshall', 'Daniel Bhoi', 'Peter Bhoi', "", 'Academic Strategist', "", 2, '2 hours only for April'];
    const index = 1;
    const result = convertor.getRowData(row, index);
    expect(result).toEqual(expect.any(Object));
    expect(Object.keys(result)).toEqual([
      "contractorName",
      "studentName",
      "parentName",
      "service",
      "level",
      "serviceRate",
      "itemDescription",
      "itemQuantity",
      "itemAmount",
      "index"
    ]);
  });


  test("createDataToWrite should return an array of objects with the correct keys", () => {
    const finalWorksheet = convertor.parseXlsx(finalTestFileName, testFilesDir);
    const proposedWorkSheet = convertor.parseXlsx(proposedTestFileName, testFilesDir);

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
    const finalSheetResult = convertor.createDataToWrite(finalWorksheet, nextInvoiceNumber, date, type = "final");
    const proposedSheetResult = convertor.createDataToWrite(proposedWorkSheet, nextInvoiceNumber, date, type = "proposed");
    expect(finalSheetResult).toEqual(expect.any(Array));
    expect(proposedSheetResult).toEqual(expect.any(Array));

    if (type === "proposed") {
      const keys = Object.keys(proposedSheetResult[0]);
      expect(keys).toEqual(resultObjectKeys);
    } else if (type === "final") {
      const keys = Object.keys(finalSheetResult[0]);
      expect(keys).toEqual(resultObjectKeys);
    }
    else {
      expect(finalSheetResult || proposedSheetResult).toEqual(null);
    }

  });

  test("createDataToWrite function is not returning an empty array", () => {
    const worksheet = convertor.parseXlsx(finalTestFileName, testFilesDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const result = convertor.createDataToWrite(worksheet, nextInvoiceNumber, date);
    expect(result).not.toEqual([]);
  });

  test("writeDataToCsv function should write data to a csv file", async () => {
    jest.setTimeout(5000);
    const worksheet = convertor.parseXlsx(finalTestFileName, testFilesDir);
    const csvFile = convertor.createCsvFile(finalTestFileName, testFilesDir, outputDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const type = "final"
    const data = convertor.createDataToWrite(worksheet, nextInvoiceNumber, date, type);
    convertor.writeDataToCsv(csvFile, data, outputDir);


    // check if data written to csv file is the same as the data returned from createDataToWrite function
    const csvFilePath = `${outputDir}/${csvFile}`;
    const dataFromCsvFile = await csv().fromFile(csvFilePath);
    expect(data).toEqual(dataFromCsvFile);
  });
});
