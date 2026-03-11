// Convert controller

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { parseXlsx, createCsvFile, writeDataToCsv } = require("../utils/convertor");
const { createDataToWrite } = require("../services/conversion.service");

const inputDir = path.join(__dirname, "../../storage/input");
const outputDir = path.join(__dirname, "../../storage/output");

const SUPPORTED_MIMETYPES = ["spreadsheet", "ms-excel"];

// @desc    Convert uploaded Excel file to CSV
// @route   POST /convert
// @access  Public

exports.convertFile = async (req, res) => {
  const { nextInvoiceNumber, date, type } = req.body;

  if (!req.files) {
    return res.status(400).json({ msg: "No file uploaded" });
  }
  if (!nextInvoiceNumber) {
    return res.status(400).json({ msg: "Please provide nextInvoiceNumber" });
  }
  if (!date) {
    return res.status(400).json({ msg: "Please provide date" });
  }

  const file = req.files.file;
  const isValidType = SUPPORTED_MIMETYPES.some(t => file.mimetype.includes(t));
  if (!isValidType) {
    return res
      .status(400)
      .json({ msg: "Wrong file type was uploaded, please upload excel file" });
  }

  try {
    const now = new Date();
    const pad = (n, len = 2) => n.toString().padStart(len, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
    const randomId = crypto.randomBytes(2).toString("hex");
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const uniqueFileName = `${baseName}_${timestamp}_${randomId}${fileExtension}`;

    await file.mv(path.join(inputDir, uniqueFileName));

    const worksheet = parseXlsx(uniqueFileName, inputDir);
    const csvFile = createCsvFile(uniqueFileName, inputDir, outputDir);
    const dataToWrite = await createDataToWrite(worksheet, nextInvoiceNumber, date, type);

    if (!dataToWrite.length) {
      return res.status(500).json({ msg: "Server failed to convert data" });
    }

    await writeDataToCsv(csvFile, dataToWrite, outputDir);

    const files = fs.readdirSync(outputDir);
    const fileName = files.find(f => f.includes(csvFile));
    const baseUrl = process.env.NODE_ENV === "development"
      ? process.env.BASE_URL
      : process.env.BASE_URL_PROD;

    return res.json({
      success: true,
      outputFile: {
        name: fileName,
        url: `${baseUrl}/output/${encodeURIComponent(fileName)}`,
        size: fs.existsSync(`${outputDir}/${fileName}`)
          ? fs.statSync(`${outputDir}/${fileName}`).size
          : 0,
        type: "application/csv"
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      msg: "Something went wrong",
      error: err.message
    });
  }
};

// @desc    Download converted CSV file
// @route   GET /output/:fileName
// @access  Public

exports.downloadFile = (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(outputDir, fileName);

  // Prevent path traversal: resolved path must stay within outputDir
  if (!filePath.startsWith(outputDir + path.sep) && filePath !== outputDir) {
    return res.status(400).json({ msg: "Invalid file name" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ msg: "File not found" });
  }

  res.download(filePath);
};
