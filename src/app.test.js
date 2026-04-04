const request = require("supertest");
const fs = require("fs");
const app = require("./app");
const { connectDB, closeDB } = require("./config/db");

const filePath = `${__dirname}/test_files/final_billing_test_sheet.xlsx`;
const wrongFilePath = `${__dirname}/test_files/test.txt`;
const inputDir = `${__dirname}/../storage/input`;

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await closeDB();
});

describe("GET / - Test api root directory", () => {
  test("It should respond with a 200 and message Hello Convertor", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true, data: { message: "Hello Convertor" } });
  });
})

describe("POST /convert - upload document to convertor", () => {

  test("It should respond with a 400 status code and a message if no file is uploaded", async () => {
    const response = await request(app).post("/convert");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ success: false, error: "No file uploaded" });
  });

  test("It should respond with a 400 status code and a message if no nextInvoiceNumber is provided", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("date", "2023-01-01")
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ success: false, error: "Please provide nextInvoiceNumber" });
  });

  test("It should respond with a 400 status code and a message if no date is provided", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("nextInvoiceNumber", "1000")
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ success: false, error: "Please provide date" });
  });

  test("It should response with a 400 status code and a message when file type uploaded is not excel", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", wrongFilePath)
      .field("nextInvoiceNumber", 1000)
      .field("date", "2023-01-01");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("It should check if the uploaded file exists in the input directory", async () => {
    jest.setTimeout(30000);
    const columnMapping = JSON.stringify({ practitioner: 0, student: 1, parent: 2, serviceDesc: 4, hours: 5, insuranceReceipt: 9, registrationFee: 11 });
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("nextInvoiceNumber", 1000)
      .field("date", "2023-01-01")
      .field("columnMapping", columnMapping)
      .set("Accept", "application/json");

    const inputFiles = fs.readdirSync(inputDir);
    expect(inputFiles.some(f => f.includes("final_billing_test_sheet"))).toBe(true);
  });

  test("It should respond with a 200 status code", async () => {
    jest.setTimeout(30000);
    const newTemplatePath = `${__dirname}/test_files/new_template_test_sheet.xlsx`;
    const columnMapping = JSON.stringify({ practitioner: 0, student: 1, parent: 2, serviceDesc: 4, hours: 5, insuranceReceipt: 9, registrationFee: 11 });
    const response = await request(app)
      .post("/convert")
      .attach("file", newTemplatePath)
      .field("nextInvoiceNumber", 9119)
      .field("date", "2026-03-05")
      .field("columnMapping", columnMapping)
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(200);
  });

});

describe("GET /output/:filename - download document from convertor", () => {

  test("It should respond with a 404 status code and a message if file is not found in output directory ", async () => {
    const response = await request(app).get("/output/doesnotexist.csv");
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ success: false, error: "File not found" });
  });

  test("It should respond with a 200 status code", async () => {
    const response = await request(app).get("/output/output.txt");
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with a download", async () => {
    const response = await request(app).get("/output/output.txt");
    expect(response.header["content-disposition"]).toEqual("attachment; filename=\"output.txt\"");
  });

});