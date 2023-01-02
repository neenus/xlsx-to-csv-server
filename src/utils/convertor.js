const fs = require("fs");
const xlsx = require("node-xlsx");
const convertor = require("json-2-csv");
const path = require("path");
const servicesList = require("../data/services.json");


let worksheet;

const parseXlsx = (fileName, inputDir) => worksheet = xlsx.parse(`${inputDir}/${fileName}`);

const createCsvFile = (fileName, inputDir, outputDir) => {
  // change file extension to .csv
  const csvFile = path
    .basename(`${inputDir}/${fileName}`)
    .replace(".xlsx", ".csv");
  fs.copyFile(`${inputDir}/${fileName}`, `${outputDir}/${csvFile}`, async err => {
    if (err) throw err;
    await fs.writeFile(`${outputDir}/${csvFile}`, "", err => {
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

const setServiceName = service => {
  if (service.toLowerCase() === "tutoring") return "Math Remediation";
  const serviceObj = servicesList.find(s => s.service_name.toLowerCase() === service.toLowerCase() ? service : null);
  if (serviceObj) return serviceObj.service_name;
  else {
    // throw error
    console.log("Error: Service not found");
    return null;
  }
}

const createDataToWrite = (worksheet, nextInvoiceNumber, date) => {
  const dataToWrite = [];
  const parsedDate = new Date(date);
  const adjustedDate = parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000;
  const dateString = new Date(adjustedDate).toLocaleDateString();
  const practicionerName = worksheet[0].data[0][1];

  worksheet.forEach(sheet => {
    sheet.data.forEach((row, index) => {
      if (row[0] === "Yes") {
        const level = row[4];
        const service = setServiceName(row[5]);
        const serviceBillingRate = getServiceBillingRate(service, level);
        const data = {
          "*InvoiceNo": `${+nextInvoiceNumber + 1}`,
          "*Customer": row[3],
          "*InvoiceDate": dateString,
          "*DueDate": dateString,
          Terms: "Due on Receipt",
          Location: "",
          Memo: "",
          "Item(Product/Service)": service,
          ItemDescription: `${row[2]} ${service} with ${practicionerName}; dates of service: ${row[6]} - ${row[9]} sessions`,
          ItemQuantity: `${row[10]}`,
          ItemRate: `${serviceBillingRate}`,
          "*ItemAmount": `${row[10] * serviceBillingRate}`,
          ItemTaxAmount: `0`
        };
        dataToWrite.push(data);
        nextInvoiceNumber++;
      };
    });
  });
  return dataToWrite;
};

const writeDataToCsv = async (fileName, data, outputDir) => {
  if (!data.length) {
    return;
  };
  convertor.json2csv(data, (err, csvContent) => {
    if (err) throw err;
    fs.writeFile(`${outputDir}/${fileName}`, csvContent, err => {
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
  getServiceBillingRate,
  setServiceName
};
