// Convert controller

const fs = require("fs");
const path = require("path");
const xlsx = require("node-xlsx");
const { runConversionJob } = require("../services/conversion-job.service");
const { buildUniqueUploadName } = require("../utils/upload.util");
const asyncHandler = require("../middlewares/asyncHandler");
const { AppError } = require("../middlewares/error.middleware");

const inputDir = path.join(__dirname, "../../storage/input");
const outputDir = path.join(__dirname, "../../storage/output");

const SUPPORTED_MIMETYPES = ["spreadsheet", "ms-excel"];

const normalizeCell = v => (v == null ? "" : String(v).trim().toLowerCase());

// @desc    Convert uploaded Excel file to CSV
// @route   POST /convert
// @access  Public
exports.convertFile = asyncHandler(async (req, res) => {
  const { nextInvoiceNumber, date, type } = req.body;

  if (!req.files) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  if (!nextInvoiceNumber) {
    return res.status(400).json({ success: false, error: "Please provide nextInvoiceNumber" });
  }
  if (!date) {
    return res.status(400).json({ success: false, error: "Please provide date" });
  }

  const file = req.files.file;
  const isValidType = SUPPORTED_MIMETYPES.some(t => file.mimetype.includes(t));
  if (!isValidType) {
    return res
      .status(400)
      .json({ success: false, error: "Wrong file type was uploaded, please upload excel file" });
  }

  const uniqueFileName = buildUniqueUploadName(file.name);
  const { csvFile, rows } = await runConversionJob({
    file,
    inputDir,
    outputDir,
    uniqueFileName,
    nextInvoiceNumber,
    date,
    type
  });

  if (!rows.length) {
    throw new AppError("Server failed to convert data", 500);
  }

  const fileName = csvFile;
  const baseUrl = process.env.NODE_ENV === "development"
    ? process.env.BASE_URL
    : process.env.BASE_URL_PROD;

  res.json({
    success: true,
    data: {
      name: fileName,
      url: `${baseUrl}/output/${encodeURIComponent(fileName)}`,
      size: fs.existsSync(`${outputDir}/${fileName}`)
        ? fs.statSync(`${outputDir}/${fileName}`).size
        : 0,
      type: "application/csv"
    }
  });
});

// @desc    Download converted CSV file
// @route   GET /output/:fileName
// @access  Public
exports.downloadFile = (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(outputDir, fileName);

  // Prevent path traversal: resolved path must stay within outputDir
  if (!filePath.startsWith(outputDir + path.sep) && filePath !== outputDir) {
    return res.status(400).json({ success: false, error: "Invalid file name" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "File not found" });
  }

  res.download(filePath);
};

// @desc    Parse xlsx headers without persisting the file
// @route   POST /convert/parse-headers
// @access  Public
exports.parseHeaders = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }

  const file = req.files.file;
  const isValidType = SUPPORTED_MIMETYPES.some(t => file.mimetype.includes(t));
  if (!isValidType) {
    return res.status(400).json({ success: false, error: "Wrong file type, please upload an excel file" });
  }

  // Parse from buffer — node-xlsx accepts a Buffer directly, no disk write needed
  const sheets = xlsx.parse(file.data);

  // Find billing sheet by name, fall back to first sheet
  const billingSheet = sheets.find(s => normalizeCell(s.name).includes("billing")) || sheets[0];
  if (!billingSheet) {
    return res.status(422).json({ success: false, error: "No billing sheet found in the uploaded file" });
  }

  // Find header row: first row where any cell normalized-matches "practitioner"
  const headerRowIndex = billingSheet.data.findIndex(row =>
    Array.isArray(row) &&
    row.some(cell => normalizeCell(cell).includes("practitioner"))
  );

  if (headerRowIndex === -1) {
    return res.status(422).json({
      success: false,
      error: "Could not detect the header row. Ensure the sheet contains a 'Practitioner name' column."
    });
  }

  const headers = (billingSheet.data[headerRowIndex] || []).map(h =>
    h == null ? "" : String(h).trim()
  );

  res.json({
    success: true,
    data: { sheetName: billingSheet.name, headers, headerRowIndex }
  });
});
