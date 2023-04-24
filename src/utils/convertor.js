const fs = require("fs");
const xlsx = require("node-xlsx");
const convertor = require("json-2-csv");
const path = require("path");
const servicesList = require("../data/services.json");
const contractorsList = require("../data/contractors.json");


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
  if (service.toLowerCase().trim() === "tutoring") return "Math Remediation";
  const serviceObj = servicesList.find(s => s.service_name.toLowerCase().trim() === service.toLowerCase().trim() ? service : null);
  if (serviceObj) return serviceObj.service_name;
  else {
    // throw error
    console.log("Error: Service not found");
    return null;
  }
}

const getRowData = (row, index) => {
  console.log({ row, index })
  const contractorName = row[0] ? contractorsList.find(c => c.name.toLowerCase().trim() === row[0].toLowerCase().trim()) : null;
  const studentName = contractorName ? row[1] : null;
  const parentName = contractorName ? row[2] : null;
  const service = contractorName ? setServiceName(row[4]) : null;
  const level = contractorName ? row[3] : null;
  const serviceRate = (contractorName && service) ? getServiceBillingRate(service, level) : null;
  const itemDescription = contractorName ? `${studentName} ${service} with ${contractorName.name}` : null;
  const itemQuantity = contractorName ? row[5] : null;
  const itemAmount = contractorName ? serviceRate * itemQuantity : null;

  if (contractorName && contractorName.name)
    return {
      contractorName: contractorName.name,
      studentName,
      parentName,
      service,
      level,
      serviceRate,
      itemDescription,
      itemQuantity,
      itemAmount,
      index
    }
  else return null;
}

const createDataToWrite = (worksheet, nextInvoiceNumber, date, type) => {
  console.log("Creating data to write to CSV file....");
  const dataToWrite = [];
  const parsedDate = new Date(date);
  const adjustedDate = parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000;
  const dateString = new Date(adjustedDate).toLocaleDateString();

  if (type === "proposed") {
    // Proposed billing sheet - begining of the month billing
    console.log("Creating data for proposed billing sheet....");
    worksheet.forEach(sheet => {
      sheet.data.forEach((row, index) => {
        const rowData = getRowData(row, index);
        if (!rowData) return;
        const data = {
          "*InvoiceNo": `${+nextInvoiceNumber + 1}`,
          "*Customer": rowData.parentName,
          "*InvoiceDate": dateString,
          "*DueDate": dateString,
          Terms: "Due on Receipt",
          Location: "",
          Memo: "",
          "Item(Product/Service)": rowData.service,
          ItemDescription: rowData.itemDescription,
          ItemQuantity: `${rowData.itemQuantity}`,
          ItemRate: `${rowData.serviceRate}`,
          "*ItemAmount": `${rowData.itemAmount}`,
          ItemTaxAmount: "0"
        }
        dataToWrite.push(data);
        nextInvoiceNumber++;
      });
    });
    return dataToWrite;
  } else if (type === "final") {
    // Final billing sheet - end of the month billing
    console.log("Creating data for final billing sheet....");
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
  } else {
    console.log("Error: Invalid type");
    return null;
  }
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
  setServiceName,
  getRowData
};
