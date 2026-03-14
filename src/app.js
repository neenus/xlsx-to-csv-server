const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// import routes
const contractors = require("./routes/contractors.routes");
const services = require("./routes/services.routes");
const auth = require("./routes/auth.routes");
const convert = require("./routes/convert.routes");
const { downloadFile } = require("./controllers/convert.controller");

const { errorHandler } = require("./middlewares/error.middleware");

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
app.get("/", (req, res) => res.json({ success: true, data: { message: "Hello Convertor" } }));

app.get("/api/v1/version", (req, res) => {
  const packageJson = fs.readFileSync(
    path.join(__dirname, "../package.json"),
    "utf8"
  );
  const version = JSON.parse(packageJson).version;
  res.json({ success: true, data: { version } });
});

app.get("/output/:fileName", downloadFile);

// Mount routers
app.use("/convert", convert);
app.use("/api/v1/contractors", contractors);
app.use("/api/v1/services", services);
app.use("/api/v1/auth", auth);

app.use(errorHandler);

module.exports = app;
