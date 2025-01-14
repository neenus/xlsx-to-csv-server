const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// import routes
const contractors = require("./routes/contractors.routes");
const services = require("./routes/services.routes");
const auth = require("./routes/auth.routes");

const {
  parseXlsx,
  createCsvFile,
  createDataToWrite,
  writeDataToCsv
} = require("./utils/convertor");

const inputDir = path.join(__dirname, "../storage/input");
const outputDir = path.join(__dirname, "../storage/output");

const app = express();

// Middleware
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms")
);
app.use(fileUpload());
app.use(express.json());
app.use(
  cors({
    origin: [process.env.FE_DEV_URL, process.env.FE_PROD_URL],
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.get("/", (req, res) => res.send({ msg: "Hello Convertor" }));

app.get("/api/v1/version", (req, res, next) => {
  const packageJson = fs.readFileSync(
    path.join(__dirname, "../package.json"),
    "utf8"
  );
  const version = JSON.parse(packageJson).version;
  res.json({ version });
})

// create /convert endpoint to receive a file upload
app.post("/convert", async (req, res) => {
  const { nextInvoiceNumber, date, type } = req.body;

  if (!req.files) {
    return res.status(400).json({ msg: "No file uploaded" });
  } else if (!nextInvoiceNumber) {
    return res.status(400).json({ msg: "Please provide nextInvoiceNumber" });
  } else if (!date) {
    return res.status(400).json({ msg: "Please provide date" });
  }

  const file = req.files.file;
  // Check if file is a excel file
  if (
    !file.mimetype.includes("spreadsheet") &&
    !file.mimetype.includes("ms-excel")
  ) {
    return res
      .status(400)
      .json({ msg: "Wrong file type was uploaded, please upload excel file" });
  }

  await file.mv(`${inputDir}/${file.name}`, async err => {
    if (err) {
      return res.status(500).send(err);
    }

    const worksheet = parseXlsx(file.name, inputDir);
    const csvFile = createCsvFile(file.name, inputDir, outputDir);
    const dataToWrite = await createDataToWrite(worksheet, nextInvoiceNumber, date, type);
    if (dataToWrite.length) {
      writeDataToCsv(csvFile, dataToWrite, outputDir);
    } else {
      return res.status(500).json({ msg: "Server failed to convert data" });
    }

    // get a list of files in the output directory
    const files = fs.readdirSync(`${outputDir}`);
    const fileName = files.find(file => file.includes(csvFile));

    const outputFile = {
      name: fileName,
      url: `${process.env.NODE_ENV === "development" ? process.env.BASE_URL : process.env.BASE_URL_PROD}/output/${encodeURIComponent(fileName)}`,
      size: fs.existsSync(`${outputDir}/${fileName}`) ? fs.statSync(`${outputDir}/${fileName}`).size : 0,
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

app.get("/output/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const file = `${outputDir}/${fileName}`;

  if (!fs.existsSync(file)) {
    return res.status(404).json({ msg: "File not found" });
  }

  res.download(file);
});

// Mount routers
app.use("/api/v1/contractors", contractors);
app.use("/api/v1/services", services);
app.use("/api/v1/auth", auth);

module.exports = app;
