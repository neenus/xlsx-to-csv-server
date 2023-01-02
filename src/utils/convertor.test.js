const request = require("supertest");
const fs = require("fs");
const csv = require("csvtojson");
const convertor = require("./convertor");

const testFilesDir = `${__dirname}/../test_files`;
const testFileName = `Taylor Proposed March 2022.xlsx`;
const outputDir = `${__dirname}/../../storage/output`;


describe("Test convertor module", () => {

  test("convertor module should be defined", () => expect(convertor).toBeDefined());

  test("convertor module should export an object with the correct keys", () => {
    // check if the object has 6 keys since there are 6 functions
    expect(Object.keys(convertor).length).toBe(6);
    // check if the object has the correct keys
    expect(convertor).toEqual(expect.objectContaining({
      parseXlsx: expect.any(Function),
      createCsvFile: expect.any(Function),
      createDataToWrite: expect.any(Function),
      writeDataToCsv: expect.any(Function),
      getServiceBillingRate: expect.any(Function),
      setServiceName: expect.any(Function),
    }));
  });

  test("parseXlsx function should return parsed xls/xlsx as an array of objects", () => {
    const result = convertor.parseXlsx(testFileName, testFilesDir);
    expect(result).toEqual(expect.any(Array));
  });

  test("createCsvFile function should create a csv file in the output directory with the same name", async () => {
    const response = await convertor.createCsvFile(testFileName, testFilesDir, outputDir);
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

  test("createDataToWrite should return an array of objects with the correct keys", () => {
    const worksheet = convertor.parseXlsx(testFileName, testFilesDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const result = convertor.createDataToWrite(worksheet, nextInvoiceNumber, date);
    expect(result).toEqual(expect.any(Array));

    const keys = Object.keys(result[0]);
    expect(keys).toEqual([
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
    ]);
  });

  test("createDataToWrite function is not returning an empty array", () => {
    const worksheet = convertor.parseXlsx(testFileName, testFilesDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const result = convertor.createDataToWrite(worksheet, nextInvoiceNumber, date);
    expect(result).not.toEqual([]);
  });

  test("writeDataToCsv function should write data to a csv file", async () => {
    jest.setTimeout(5000);
    const worksheet = convertor.parseXlsx(testFileName, testFilesDir);
    const csvFile = convertor.createCsvFile(testFileName, testFilesDir, outputDir);

    const nextInvoiceNumber = 1000;
    const date = "2023-01-01";
    const data = convertor.createDataToWrite(worksheet, nextInvoiceNumber, date);
    convertor.writeDataToCsv(csvFile, data, outputDir);


    // check if data written to csv file is the same as the data returned from createDataToWrite function
    const csvFilePath = `${outputDir}/${csvFile}`;
    const dataFromCsvFile = await csv().fromFile(csvFilePath);
    expect(data).toEqual(dataFromCsvFile);
  });
});
