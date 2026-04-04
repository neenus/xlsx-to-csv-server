const request = require("supertest");
const fs = require("fs");
const csv = require("csvtojson");
const convertor = require("./convertor");
const { createDataToWrite, buildServiceIndexes, convertWorkbook } = require("../services/conversion.service");
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

  const newTemplateColumnMapping = {
    practitioner: 0, student: 1, parent: 2, serviceDesc: 4,
    hours: 5, insuranceReceipt: 9, registrationFee: 11
  };

  test("createDataToWrite should return an array of objects with correct keys (new template)", async () => {
    const worksheet = convertor.parseXlsx("new_template_test_sheet.xlsx", testFilesDir);
    const result = await createDataToWrite(worksheet, 9119, "2026-03-05", newTemplateColumnMapping);

    expect(result).toEqual(expect.any(Array));
    if (result.length > 0) {
      const keys = Object.keys(result[0]);
      expect(keys).toEqual([
        "*InvoiceNo", "*Customer", "*InvoiceDate", "*DueDate", "Terms",
        "Location", "Memo", "Item(Product/Service)", "ItemDescription",
        "ItemQuantity", "ItemRate", "*ItemAmount", "ItemTaxAmount"
      ]);
    }
  });

  test("createDataToWrite function should not return an empty array (new template)", async () => {
    const worksheet = convertor.parseXlsx("new_template_test_sheet.xlsx", testFilesDir);
    const result = await createDataToWrite(worksheet, 9119, "2026-03-05", newTemplateColumnMapping);
    expect(result.length).toBeGreaterThan(0);
  });

  test("writeDataToCsv function should write data to a csv file", async () => {
    const worksheet = convertor.parseXlsx("new_template_test_sheet.xlsx", testFilesDir);
    const csvFile = await convertor.createCsvFile("new_template_test_sheet.xlsx", testFilesDir, outputDir);
    const data = await createDataToWrite(worksheet, 9119, "2026-03-05", newTemplateColumnMapping);
    await convertor.writeDataToCsv(csvFile, data, outputDir);

    const csvFilePath = `${outputDir}/${csvFile}`;
    const dataFromCsvFile = await csv().fromFile(csvFilePath);
    expect(data).toEqual(dataFromCsvFile);
  });
});

describe("convertNew", () => {
  const mockServices = [
    { _id: "1", service_name: "Academic Strategies", service_education_level: ["elementary","high school"], service_rate: 85, aliases: ["academic and writing strategies","academic & writing strategies"] },
    { _id: "2", service_name: "Reading Remediation", service_education_level: ["elementary","high school"], service_rate: 86, aliases: ["reading reading remediation"] },
    { _id: "3", service_name: "Math Tutoring", service_education_level: ["elementary","high school"], service_rate: 85, aliases: ["math tutoring","math recovery"] },
    { _id: "4", service_name: "Postsecondary Academic Strategies", service_education_level: ["postsecondary"], service_rate: 100, aliases: ["postsecondary academic","ps academic"] },
    { _id: "5", service_name: "Enrolment Fee", service_education_level: ["elementary","high school","postsecondary"], service_rate: 120, aliases: [] }
  ];

  const serviceIndexes = buildServiceIndexes(mockServices);

  const columnMapping = {
    practitioner: 0,
    student: 1,
    parent: 2,
    serviceDesc: 4,
    hours: 5,
    insuranceReceipt: 9,
    registrationFee: 11
  };

  const sampleData = [
    // practitioner row with one student — insurance receipt flagged
    ["Amarinder Mehta", "Emmerson Nyland", "Megan Nyland", "Holland Landing", "Elementary Academic and Writing Strategies", 4, null, null, null, "X", null, null],
    // student row under same practitioner (null practitioner) — with registration fee
    [null, "Second Student", "Parent Two", "City", "Secondary Math Tutoring", 6, null, null, null, null, null, "X"]
  ];

  test("emits service invoice for each valid student row", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    expect(rows[0]["*InvoiceNo"]).toBe("9119");
    expect(rows[0]["*Customer"]).toBe("Emmerson Nyland");
    expect(rows[0]["Item(Product/Service)"]).toBe("Academic Strategies");
    expect(rows[0]["ItemQuantity"]).toBe("4");
  });

  test("appends insurance receipt suffix when flag is set", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    expect(rows[0]["ItemDescription"]).toMatch(/insurance receipt to be issued at the end of the month/);
  });

  test("does not append insurance receipt suffix when flag is not set", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    const secondServiceRow = rows.find(r => r["*Customer"] === "Second Student" && r["Item(Product/Service)"] === "Math Tutoring");
    expect(secondServiceRow).toBeDefined();
    expect(secondServiceRow["ItemDescription"]).not.toMatch(/insurance receipt/);
  });

  test("emits enrollment fee invoice when registration fee flag is set", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    const feeRow = rows.find(r => r["Item(Product/Service)"] === "Enrolment Fee");
    expect(feeRow).toBeDefined();
    expect(feeRow["*Customer"]).toBe("Parent Two");
    expect(feeRow["*ItemAmount"]).toBe("120");
  });

  test("practitioner name carries down to rows where practitioner cell is null", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    const secondRow = rows.find(r => r["*Customer"] === "Second Student");
    expect(secondRow["ItemDescription"]).toMatch(/Amarinder Mehta/);
  });

  test("invoice numbers increment sequentially across all emitted rows", () => {
    const rows = convertWorkbook({
      workbook: sampleData,
      type: "new",
      invoiceStart: 9119,
      invoiceDate: "2026-03-05",
      lookups: { serviceIndexes, columnMapping }
    });
    const numbers = rows.map(r => Number(r["*InvoiceNo"]));
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1);
    }
  });
});

describe("resolveService alias matching", () => {
  const mockServices = [
    {
      _id: "1",
      service_name: "Academic Strategies",
      service_education_level: ["elementary", "high school"],
      service_rate: 85,
      aliases: ["academic and writing strategies", "academic & writing strategies"]
    },
    {
      _id: "2",
      service_name: "Reading Remediation",
      service_education_level: ["elementary", "high school"],
      service_rate: 86,
      aliases: ["reading reading remediation"]
    }
  ];

  test("resolves service by alias substring match", () => {
    const indexes = buildServiceIndexes(mockServices);
    expect(indexes.byAlias.has("academic and writing strategies")).toBe(true);
    expect(indexes.byAlias.has("academic & writing strategies")).toBe(true);
    expect(indexes.byAlias.has("reading reading remediation")).toBe(true);
  });

  test("resolves service name from verbose description via alias", () => {
    const indexes = buildServiceIndexes(mockServices);
    const aliasKey = "academic and writing strategies";
    const desc = "elementary academic and writing strategies";
    let matched = null;
    for (const [key, svc] of indexes.byAlias) {
      if (desc.includes(key)) { matched = svc; break; }
    }
    expect(matched).not.toBeNull();
    expect(matched.service_name).toBe("Academic Strategies");
  });
});
