const request = require("supertest");
const fs = require("fs");
const app = require("./app");

const filePath = `${__dirname}/test_files/Taylor Proposed March 2022.xlsx`;
const wrongFilePath = `${__dirname}/test_files/test.txt`;
const inputDir = `${__dirname}/../storage/input`;

describe("GET / - Test api root directory", () => {
  test("It should respond with a 200 and message Hello Convertor", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ msg: "Hello Convertor" });
  });
})

describe("POST /convert - upload document to convertor", () => {

  test("It should respond with a 400 status code and a message if no file is uploaded", async () => {
    const response = await request(app).post("/convert");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ msg: "No file uploaded" });
  });

  test("It should respond with a 400 status code and a message if no nextInvoiceNumber is provided", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("date", "2023-01-01")
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ msg: "Please provide nextInvoiceNumber" });
  });

  test("It should respond with a 400 status code and a message if no date is provided", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("nextInvoiceNumber", "1000")
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ msg: "Please provide date" });
  });

  test("It should response with a 400 status code and a message when file type uploaded is not excel", async () => {
    const response = await request(app)
      .post("/convert")
      .attach("file", wrongFilePath)
      .field("nextInvoiceNumber", 1000)
      .field("date", "2023-01-01");
    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ msg: "Wrong file type was uploaded, please upload excel file" });
  });

  test("It should check if the uploaded file exists in the input directory", async () => {
    // increase test timeout to 5 seconds to allow for async file upload
    jest.setTimeout(5000);
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("nextInvoiceNumber", 1000)
      .field("date", "2023-01-01")
      .set("Accept", "application/json");

    const inputFiles = fs.readdirSync(inputDir);
    expect(inputFiles).toContain("Taylor Proposed March 2022.xlsx");
  });

  test("It should respond with a 200 status code", async () => {
    // increase test timeout to 5 seconds to allow for async file upload
    jest.setTimeout(5000);
    const response = await request(app)
      .post("/convert")
      .attach("file", filePath)
      .field("nextInvoiceNumber", 1000)
      .field("date", "2023-01-01")
      .set("Accept", "application/json");
    expect(response.statusCode).toBe(200);
  });

});

describe("GET /output/:filename - download document from convertor", () => {

  test("It should respond with a 404 status code and a message if file is not found in output directory ", async () => {
    const response = await request(app).get("/output/doesnotexist.csv");
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ msg: "File not found" });
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