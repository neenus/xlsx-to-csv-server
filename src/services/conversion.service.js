const Service = require("../models/Service.model");

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
  const byAlias = new Map();

  (services || []).forEach(service => {
    if (!service || !service.service_name) return;

    const serviceNameKey = normalize(service.service_name);
    if (!byName.has(serviceNameKey)) {
      byName.set(serviceNameKey, service);
    }

    (service.service_education_level || []).forEach(level => {
      byNameAndLevel.set(`${serviceNameKey}|${normalize(level)}`, service);
    });

    (service.aliases || []).forEach(alias => {
      const aliasKey = normalize(alias);
      if (aliasKey && !byAlias.has(aliasKey)) {
        byAlias.set(aliasKey, service);
      }
    });
  });

  return { byName, byNameAndLevel, byAlias };
};

const resolveService = (rawServiceName, rawLevel, serviceIndexes) => {
  const serviceNameKey = normalize(rawServiceName);
  if (!serviceNameKey) return { name: null, rate: null };

  const normalizedLevel = normalizeLevel(rawLevel);
  const byLevel = serviceIndexes.byNameAndLevel.get(`${serviceNameKey}|${normalizedLevel}`);
  const byName = serviceIndexes.byName.get(serviceNameKey);

  // Alias lookup: check if any registered alias is a substring of the description
  let byAlias = null;
  if (!byLevel && !byName && serviceIndexes.byAlias) {
    for (const [aliasKey, service] of serviceIndexes.byAlias) {
      if (serviceNameKey.includes(aliasKey)) {
        byAlias = service;
        break;
      }
    }
  }

  const service = byLevel || byName || byAlias;

  if (!service) {
    // Fallback: try to parse rate from description text e.g. "$90/hr", "$60/hr"
    const rateMatch = rawServiceName && rawServiceName.toString().match(/\$(\d+(?:\.\d+)?)(?:\/hr)?/);
    const parsedRate = rateMatch ? Number(rateMatch[1]) : null;
    return {
      name: rawServiceName ? rawServiceName.toString().trim() : null,
      rate: parsedRate
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

const convertNew = ({ data, columnMapping, invoiceStart, invoiceDate, serviceIndexes }) => {
  const {
    practitioner: pCol,
    student: sCol,
    parent: parentCol,
    serviceDesc: serviceCol,
    hours: hoursCol,
    insuranceReceipt: insuranceCol,
    registrationFee: regFeeCol
  } = columnMapping;

  let invoiceNo = Number(invoiceStart);
  const rows = [];
  let currentPractitioner = "";
  const month = getMonthName(invoiceDate);

  data.forEach(row => {
    if (!Array.isArray(row)) return;

    // Carry practitioner name down when cell is not empty
    const rawPractitioner = row[pCol];
    if (rawPractitioner != null && String(rawPractitioner).trim() !== "") {
      currentPractitioner = String(rawPractitioner).trim();
    }

    // Skip rows with no student name
    const student = row[sCol] != null ? String(row[sCol]).trim() : "";
    if (!student) return;

    const parent = row[parentCol] != null ? String(row[parentCol]).trim() : "";
    const rawServiceDesc = row[serviceCol] != null ? String(row[serviceCol]).trim() : "";
    const hours = Number(row[hoursCol]);
    const hasInsuranceReceipt = isTruthyMarker(row[insuranceCol]);
    const hasRegistrationFee = isTruthyMarker(row[regFeeCol]);

    if (!Number.isFinite(hours) || hours <= 0) return;
    if (!rawServiceDesc) return;

    // Pass verbose description as both service name and level:
    // alias lookup matches against full description; normalizeLevel detects embedded level keywords
    const { name: serviceName, rate: serviceRate } = resolveService(
      rawServiceDesc,
      rawServiceDesc,
      serviceIndexes
    );

    if (!serviceName) return;

    const rateFixed = serviceRate != null ? Number(Number(serviceRate).toFixed(2)) : "";
    const amount = serviceRate != null ? Number((hours * serviceRate).toFixed(2)) : "";

    const description = hasInsuranceReceipt
      ? `${hours} hours of ${serviceName} with ${currentPractitioner} for the month of ${month} - insurance receipt to be issued at the end of the month.`
      : `${hours} hours of ${serviceName} with ${currentPractitioner} for the month of ${month}`;

    rows.push(toCsvRow({
      invoiceNo,
      customer: student,
      invoiceDate,
      service: serviceName,
      description,
      quantity: hours,
      rate: rateFixed,
      amount
    }));
    invoiceNo++;

    // Enrollment fee invoice
    if (hasRegistrationFee) {
      const feeCustomer =
        !parent || normalize(parent) === "n/a" ? student : parent;
      rows.push(toCsvRow({
        invoiceNo,
        customer: feeCustomer,
        invoiceDate,
        service: "Enrolment Fee",
        description: "Enrolment Fee",
        quantity: 1,
        rate: 120,
        amount: 120
      }));
      invoiceNo++;
    }
  });

  return rows;
};

const convertWorkbook = ({ workbook, type, invoiceStart, invoiceDate, lookups = {} }) => {
  if (!type || !["proposed", "final", "new"].includes(type)) {
    throw new Error("Invalid conversion type");
  }

  const parsedInvoiceStart = Number(invoiceStart);
  if (!Number.isFinite(parsedInvoiceStart)) {
    throw new Error("Invalid invoiceStart");
  }

  const formattedInvoiceDate = formatInvoiceDate(invoiceDate);
  const contractorMap = lookups.contractorMap || buildContractorMap(lookups.contractors);
  const serviceIndexes = lookups.serviceIndexes || buildServiceIndexes(lookups.services);

  if (type === "new") {
    const columnMapping = lookups.columnMapping;
    if (!columnMapping) throw new Error("columnMapping is required for type 'new'");
    return convertNew({
      data: workbook,
      columnMapping,
      invoiceStart: parsedInvoiceStart,
      invoiceDate: formattedInvoiceDate,
      serviceIndexes
    });
  }

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

const createDataToWrite = async (worksheet, nextInvoiceNumber, date, columnMapping) => {
  const servicesList = await Service.find({});
  const serviceIndexes = buildServiceIndexes(servicesList);

  // Find header row in the billing sheet
  const billingSheet = getBillingSheet(worksheet);
  const allRows = billingSheet.data || [];
  const headerRowIndex = allRows.findIndex(row =>
    Array.isArray(row) &&
    row.some(cell => normalize(String(cell == null ? "" : cell)).includes("practitioner"))
  );

  // Data rows start after the header row; if no header found use all rows
  const dataRows = headerRowIndex !== -1 ? allRows.slice(headerRowIndex + 1) : allRows;

  return convertWorkbook({
    workbook: dataRows,
    type: "new",
    invoiceStart: nextInvoiceNumber,
    invoiceDate: date,
    lookups: { serviceIndexes, columnMapping }
  });
};

module.exports = {
  convertWorkbook,
  createDataToWrite,
  buildContractorMap,
  buildServiceIndexes,
  formatInvoiceDate
};
