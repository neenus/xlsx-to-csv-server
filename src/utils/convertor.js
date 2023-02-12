const fs = require("fs");
const xlsx = require("node-xlsx");
const convertor = require("json-2-csv");
const path = require("path");
const servicesList = require("../data/services.json");

// Make sure to modify the xlsx file to have the following columns:
// add a new column with Yes on each row you'd like to be writing into the new csv file
// client name
// item name
// item description
// billing rate

let worksheet;
const inputPath = `${__dirname}/../../storage/input`;
const outputPath = `${__dirname}/../../storage/output`;

const parseXlsx = fileName => {
  return (worksheet = xlsx.parse(`${inputPath}/${fileName}`));
};

const createCsvFile = fileName => {
  // change file extension to .csv
  const csvFile = path
    .basename(`${inputPath}/${fileName}`)
    .replace(".xlsx", ".csv");
  fs.copyFile(`${inputPath}/${fileName}`, `${outputPath}/${csvFile}`, err => {
    if (err) throw err;
    fs.writeFile(`${outputPath}/${csvFile}`, "", err => {
      if (err) throw err;
    });
  });
  return csvFile;
};

const getServiceBillingRate = (service, level) => {
  // find service from servicesList and return the billing rate)
  const serviceObj = servicesList.find(
    s => {
      level = level ? level.toLowerCase() : null;
      if (!level) {
        if (s.service_name.toLowerCase() === service.toLowerCase()) return s;
      } else {
        if (s.service_name.toLowerCase() === service.toLowerCase() && s.education_level.includes(level)) return s;
      }
    }
  );
  if (serviceObj) return +serviceObj.service_rate.toFixed(2);
  else {
    // throw error
    // throw new Error("Service not found");
    console.log("Error: Service not found");
    return null;
  }
};

const setServiceName = service => service.toLowerCase() === "tutoring" ? "Math Remediation" : service;

const createDataToWrite = (worksheet, nextInvoiceNumber, date) => {
  let dataToWrite = [];
  let parsedDate = new Date(date);
  let adjustedDate =
    parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000;
  let dateString = new Date(adjustedDate).toLocaleDateString();
  let practicionerName = worksheet[0].data[0][1];
  for (const sheet of worksheet) {
    sheet.data.forEach((row, index) => {
      if (row[0] === "Yes") {
        const level = row[4];
        const service = setServiceName(row[5]);
        const serviceBillingRate = getServiceBillingRate(service, level);
        const data = {
          "*InvoiceNo": +nextInvoiceNumber + 1,
          "*Customer": row[3],
          "*InvoiceDate": dateString,
          "*DueDate": dateString,
          Terms: "Due on Receipt",
          Location: "",
          Memo: "",
          "Item(Product/Service)": service,
          ItemDescription: `${row[2]} ${row[5]} with ${practicionerName}; dates of service: ${row[6]} - ${row[9]} sessions`,
          ItemQuantity: row[10],
          ItemRate: serviceBillingRate,
          "*ItemAmount": row[10] * serviceBillingRate,
          ItemTaxAmount: 0
        };
        dataToWrite.push(data);
        nextInvoiceNumber++;
      }
    });
  }
  console.log("Creating data to write done....");
  return dataToWrite;
};

const writeDataToCsv = (fileName, data) => {
  convertor.json2csv(data, (err, csvContent) => {
    if (err) throw err;
    fs.writeFile(`${outputPath}/${fileName}`, csvContent, err => {
      if (err) throw err;
    });
    console.log("Writing data to CSV file done....");
  });
};

module.exports = {
  parseXlsx,
  createCsvFile,
  createDataToWrite,
  writeDataToCsv,
  getServiceBillingRate
};
