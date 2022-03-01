const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");

const {
  parseXlsx,
  createCsvFile,
  createDataToWrite,
  writeDataToCsv
} = require("./utils/convertor");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);
app.use(fileUpload());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000"
  })
);

// Routes
app.get("/", (req, res) => {
  res.send("Hello Convertor");
});

// create /convert endpoint to receive a file upload
app.post("/convert", cors(), async (req, res) => {
  const { nextInvoiceNumber, date } = req.body;
  if (req.files === null) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  const file = req.files.file;

  await file.mv(`${__dirname}/../input/${file.name}`, err => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    const worksheet = parseXlsx(file.name);
    const csvFile = createCsvFile(file.name);
    const dataToWrite = createDataToWrite(worksheet, nextInvoiceNumber, date);
    writeDataToCsv(csvFile, dataToWrite);

    // get a list of files in the output directory
    const files = fs.readdirSync(`${__dirname}/../output`);
    const fileName = files.find(file => file.includes(csvFile));

    const outputFile = {
      name: fileName,
      url: `${process.env.BASE_URL}/output/${fileName}`,
      size: fs.statSync(`${__dirname}/../output/${fileName}`).size,
      type: "application/csv"
    };

    if (!file) {
      return res.status(500).json({
        success: false,
        msg: "Something went wrong"
      });
    } else {
      res.json({
        success: true,
        outputFile
      });
    }
  });
});

app.get("/output/:fileName", cors(), (req, res) => {
  const fileName = req.params.fileName;
  const file = `${__dirname}/../output/${fileName}`;
  res.download(file);
});

module.exports = app;
