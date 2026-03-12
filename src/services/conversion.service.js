const Service = require("../models/Service.model");
const Contractor = require("../models/Contractor.model");

const CSV_TERMS = "Due on Receipt";

const normalize = value => (value ?? "").toString().trim().toLowerCase();

const isTruthyMarker = value => {
  const v = normalize(value);
  return v === "x" || v === "yes" || v === "true" || v === "1";
};

const formatInvoiceDate = invoiceDate => {
  if (typeof invoiceDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
    return invoiceDate;
  }

  const parsed = new Date(invoiceDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid invoiceDate");
  }

  const adjusted = new Date(parsed.getTime() + parsed.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
};

const getMonthName = invoiceDate => {
  const parsed = new Date(invoiceDate);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleString("default", { month: "long" });
};

const normalizeLevel = rawLevel => {
  const value = normalize(rawLevel);
  if (value.includes("postsecondary") || value.includes("ps")) return "postsecondary";
  if (value.includes("secondary") || value.includes("high school")) return "high school";
  if (value.includes("elementary")) return "elementary";
  return value;
};

const buildContractorMap = contractors => {
  const map = new Map();
  (contractors || []).forEach(contractor => {
    if (!contractor || !contractor.contractor_name) return;
    map.set(normalize(contractor.contractor_name), contractor);
  });
  return map;
};

const buildServiceIndexes = services => {
  const byName = new Map();
  const byNameAndLevel = new Map();

  (services || []).forEach(service => {
    if (!service || !service.service_name) return;

    const serviceNameKey = normalize(service.service_name);
    if (!byName.has(serviceNameKey)) {
      byName.set(serviceNameKey, service);
    }

    (service.service_education_level || []).forEach(level => {
      byNameAndLevel.set(`${serviceNameKey}|${normalize(level)}`, service);
    });
  });

  return { byName, byNameAndLevel };
};

const resolveService = (rawServiceName, rawLevel, serviceIndexes) => {
  const serviceNameKey = normalize(rawServiceName);
  if (!serviceNameKey) return { name: null, rate: null };

  const normalizedLevel = normalizeLevel(rawLevel);
  const byLevel = serviceIndexes.byNameAndLevel.get(`${serviceNameKey}|${normalizedLevel}`);
  const fallback = serviceIndexes.byName.get(serviceNameKey);
  const service = byLevel || fallback;

  if (!service) {
    return {
      name: rawServiceName ? rawServiceName.toString().trim() : null,
      rate: null
    };
  }

  return {
    name: service.service_name,
    rate: Number(service.service_rate)
  };
};

const toCsvRow = ({ invoiceNo, customer, invoiceDate, service, description, quantity, rate, amount }) => ({
  "*InvoiceNo": String(invoiceNo),
  "*Customer": customer || "",
  "*InvoiceDate": invoiceDate,
  "*DueDate": invoiceDate,
  Terms: CSV_TERMS,
  Location: "",
  Memo: "",
  "Item(Product/Service)": service || "",
  ItemDescription: description || "",
  ItemQuantity: String(quantity ?? ""),
  ItemRate: String(rate ?? ""),
  "*ItemAmount": String(amount ?? ""),
  ItemTaxAmount: "0"
});

const getBillingSheet = workbook => {
  if (!Array.isArray(workbook) || workbook.length === 0) {
    throw new Error("Workbook is empty");
  }

  const namedBilling = workbook.find(sheet => normalize(sheet.name).includes("billing"));
  return namedBilling || workbook[0];
};

const convertProposed = ({ data, invoiceStart, invoiceDate, contractorMap, serviceIndexes }) => {
  const month = getMonthName(invoiceDate);
  let invoiceNo = Number(invoiceStart);
  const rows = [];

  data.forEach(row => {
    if (!Array.isArray(row) || row.length < 6) return;

    const rawContractor = row[0];
    const contractor = contractorMap.get(normalize(rawContractor));
    if (!contractor) return;

    const quantity = Number(row[5]);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    const { name: serviceName, rate: serviceRate } = resolveService(row[4], row[3], serviceIndexes);
    if (!serviceName || !Number.isFinite(serviceRate)) return;

    invoiceNo += 1;

    const notesText = `${row[7] || ""} ${row[6] || ""}`;
    const hasInsuranceReceipt =
      normalize(notesText).includes("insurance receipt") || isTruthyMarker(row[9]);

    const description = hasInsuranceReceipt
      ? `${quantity} hours of ${serviceName} with ${contractor.contractor_name} for the month of ${month} - insurance receipt to be issued at the end of the month`
      : `${quantity} hours of ${serviceName} with ${contractor.contractor_name} for the month of ${month}`;

    const customer = row[1] || row[2] || row[8] || "";
    const amount = Number((quantity * serviceRate).toFixed(2));

    rows.push(
      toCsvRow({
        invoiceNo,
        customer,
        invoiceDate,
        service: serviceName,
        description,
        quantity,
        rate: Number(serviceRate.toFixed(2)),
        amount
      })
    );
  });

  return rows;
};

const convertFinal = ({ workbook, invoiceStart, invoiceDate, serviceIndexes }) => {
  let invoiceNo = Number(invoiceStart);
  const rows = [];

  const practitionerName = workbook?.[0]?.data?.[0]?.[1] || "";

  workbook.forEach(sheet => {
    (sheet.data || []).forEach(row => {
      if (!Array.isArray(row) || row[0] !== "Yes") return;

      const quantity = Number(row[10]);
      if (!Number.isFinite(quantity) || quantity <= 0) return;

      const { name: serviceName, rate: serviceRate } = resolveService(row[5], row[4], serviceIndexes);
      if (!serviceName || !Number.isFinite(serviceRate)) return;

      invoiceNo += 1;
      const amount = Number((quantity * serviceRate).toFixed(2));

      rows.push(
        toCsvRow({
          invoiceNo,
          customer: row[3],
          invoiceDate,
          service: serviceName,
          description: `${row[2]} ${serviceName} with ${practitionerName}; dates of service: ${row[6]} - ${row[9]} sessions`,
          quantity,
          rate: Number(serviceRate.toFixed(2)),
          amount
        })
      );
    });
  });

  return rows;
};

const convertWorkbook = ({ workbook, type, invoiceStart, invoiceDate, lookups = {} }) => {
  if (!type || (type !== "proposed" && type !== "final")) {
    throw new Error("Invalid conversion type");
  }

  const parsedInvoiceStart = Number(invoiceStart);
  if (!Number.isFinite(parsedInvoiceStart)) {
    throw new Error("Invalid invoiceStart");
  }

  const formattedInvoiceDate = formatInvoiceDate(invoiceDate);

  const contractorMap = lookups.contractorMap || buildContractorMap(lookups.contractors);
  const serviceIndexes =
    lookups.serviceIndexes ||
    buildServiceIndexes(lookups.services);

  if (type === "proposed") {
    const billingSheet = getBillingSheet(workbook);
    return convertProposed({
      data: billingSheet.data || [],
      invoiceStart: parsedInvoiceStart,
      invoiceDate: formattedInvoiceDate,
      contractorMap,
      serviceIndexes
    });
  }

  return convertFinal({
    workbook,
    invoiceStart: parsedInvoiceStart,
    invoiceDate: formattedInvoiceDate,
    serviceIndexes
  });
};

const createDataToWrite = async (worksheet, nextInvoiceNumber, date, type) => {
  const contractorsList = await Contractor.find({});
  const servicesList = await Service.find({});
  return convertWorkbook({
    workbook: worksheet,
    type,
    invoiceStart: nextInvoiceNumber,
    invoiceDate: date,
    lookups: {
      contractors: contractorsList,
      services: servicesList
    }
  });
};

module.exports = {
  convertWorkbook,
  createDataToWrite,
  buildContractorMap,
  buildServiceIndexes,
  formatInvoiceDate
};
