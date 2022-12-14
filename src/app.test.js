const request = require("supertest");
const app = require("./app");

describe("TEST GET /", () => {
  test("It should respond with a 200 status code", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with a message", async () => {
    const response = await request(app).get("/");
    expect(response.body).toEqual({ msg: "Hello Convertor" });
  });
})

describe("TEST GET /output/:filename", () => {
  test("It should respond with a 200 status code", async () => {
    const response = await request(app).get("/output/output.txt");
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with a download", async () => {
    const response = await request(app).get("/output/output.txt");
    expect(response.header["content-disposition"]).toEqual("attachment; filename=\"output.txt\"");
  });

  test("It should respond with a 404 status code if file does not exist", async () => {
    const response = await request(app).get("/output/doesnotexist.txt");
    expect(response.statusCode).toBe(404);
  });
});