import { useEffect, useMemo, useState } from "react";
import api from "./api";


const csvCell = (value) => {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

const csvRow = (values) => values.map(csvCell).join(",");

const accountFields = [
  ["businessName", "Business / Shop Name", "text"],
  ["ownerName", "Owner Name", "text"],
  ["businessAddress", "Business Address", "text"],
  ["entityType", "Entity Type", "text"],
  ["pan", "PAN", "text"],
  ["gstin", "GSTIN", "text"],
  ["drugLicense", "Drug Licence Number", "text"],
  ["pharmacistName", "Registered Pharmacist", "text"],
  ["openingCapital", "Opening Capital", "number"],
  ["openingStock", "Opening Stock at Cost", "number"],
  ["closingStockCost", "Closing Stock at Cost", "number"],
  ["cashBalance", "Cash in Hand", "number"],
  ["bankBalance", "Bank Balance", "number"],
  ["customerDues", "Customer Debtors", "number"],
  ["advanceToSuppliers", "Advances to Suppliers", "number"],
  ["supplierDues", "Supplier Creditors", "number"],
  ["customerAdvances", "Customer Advances", "number"],
  ["securedLoans", "Secured Loans", "number"],
  ["unsecuredLoans", "Unsecured Loans", "number"],
  ["fixedAssets", "Fixed Assets Gross Value", "number"],
  ["depreciation", "Accumulated Depreciation", "number"],
  ["drawings", "Owner Drawings", "number"],
  ["inputGst", "Input GST / ITC", "number"],
  ["outputGstPaid", "GST Paid", "number"],
  ["gstPayable", "GST Payable", "number"],
  ["tdsReceivable", "TDS Receivable", "number"],
  ["tdsPayable", "TDS Payable", "number"],
  ["prepaidExpenses", "Prepaid Expenses", "number"],
  ["outstandingExpenses", "Outstanding Expenses", "number"],
  ["rentExpense", "Rent Expense", "number"],
  ["salaryExpense", "Salary Expense", "number"],
  ["electricityExpense", "Electricity Expense", "number"],
  ["bankCharges", "Bank / Payment Charges", "number"],
  ["professionalFees", "Professional Fees", "number"],
  ["badDebts", "Bad Debts / Write-offs", "number"],
  ["otherExpense", "Other Expenses", "number"],
];

const emptyAccounts = Object.fromEntries(
  accountFields.map(([name, , type]) => [name, type === "number" ? "0" : ""])
);

function Report() {
  const [records, setRecords] = useState({
    medicines: [],
    suppliers: [],
    purchases: [],
    sales: [],
  });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accounts, setAccounts] = useState(() => {
    try {
      return {
        ...emptyAccounts,
        ...JSON.parse(localStorage.getItem("pharmasathi-accounts") || "{}"),
      };
    } catch {
      return emptyAccounts;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
        api.get("/medicines"),
        api.get("/suppliers"),
        api.get("/purchases"),
        api.get("/sales"),
      ])
      .then(([medicineRes, supplierRes, purchaseRes, saleRes]) => {
        setRecords({
          medicines: medicineRes.data || [],
          suppliers: supplierRes.data || [],
          purchases: purchaseRes.data || [],
          sales: saleRes.data || [],
        });
      })
      .catch((requestError) => {
        console.error("Error loading report:", requestError);
        setError("Report data load nahi ho paaya. Backend check karein.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem("pharmasathi-accounts", JSON.stringify(accounts));
  }, [accounts]);

  const report = useMemo(() => {
    const inRange = (date) =>
      (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
    const medicinesById = Object.fromEntries(
      records.medicines.map((medicine) => [medicine.id, medicine])
    );
    const suppliersById = Object.fromEntries(
      records.suppliers.map((supplier) => [supplier.id, supplier])
    );
    const sales = records.sales.filter((sale) => inRange(sale.saleDate || ""));
    const purchases = records.purchases.filter((purchase) =>
      inRange(purchase.purchaseDate || "")
    );
    const revenue = sales.reduce(
      (sum, sale) =>
        sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
      0
    );
    const purchaseCost = purchases.reduce(
      (sum, purchase) =>
        sum +
        Number(purchase.quantity || 0) * Number(purchase.purchasePrice || 0),
      0
    );
    const totalGst = sales.reduce((sum, sale) => {
      const medicine = medicinesById[sale.medicineId];
      const rate = Number(medicine?.gstRate ?? 5);
      const total =
        Number(sale.quantity || 0) * Number(sale.sellingPrice || 0);
      return sum + (total - (total * 100) / (100 + rate));
    }, 0);
    const stockValue = records.medicines.reduce(
      (sum, medicine) =>
        sum + Number(medicine.stockQuantity || 0) * Number(medicine.mrp || 0),
      0
    );

    return {
      medicinesById,
      suppliersById,
      sales,
      purchases,
      revenue,
      purchaseCost,
      totalGst,
      stockValue,
      grossProfit: revenue - purchaseCost,
    };
  }, [records, fromDate, toDate]);

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  const downloadCsv = (filename, rows) => {
    const blob = new Blob(["\ufeff", rows.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const periodSuffix = `${fromDate || "all"}-${toDate || "all"}`;
  const accountNumber = (name) => Number(accounts[name] || 0);
  const totalExpenses =
    accountNumber("rentExpense") +
    accountNumber("salaryExpense") +
    accountNumber("electricityExpense") +
    accountNumber("bankCharges") +
    accountNumber("professionalFees") +
    accountNumber("badDebts") +
    accountNumber("otherExpense");
  const closingStockValue =
    accountNumber("closingStockCost") || report.stockValue;
  const tradingGrossProfit =
    report.revenue +
    closingStockValue -
    accountNumber("openingStock") -
    report.purchaseCost;
  const netProfit = tradingGrossProfit - totalExpenses;
  const totalAssets =
    accountNumber("cashBalance") +
    accountNumber("bankBalance") +
    accountNumber("customerDues") +
    accountNumber("advanceToSuppliers") +
    Math.max(0, accountNumber("fixedAssets") - accountNumber("depreciation")) +
    accountNumber("inputGst") +
    accountNumber("tdsReceivable") +
    accountNumber("prepaidExpenses") +
    closingStockValue;
  const totalLiabilities =
    accountNumber("openingCapital") +
    netProfit -
    accountNumber("drawings") +
    accountNumber("supplierDues") +
    accountNumber("customerAdvances") +
    accountNumber("securedLoans") +
    accountNumber("unsecuredLoans") +
    accountNumber("gstPayable") +
    accountNumber("tdsPayable") +
    accountNumber("outstandingExpenses");
  const balanceDifference = totalAssets - totalLiabilities;

  const salesRows = () => [
    csvRow([
      "Bill No", "Date", "Customer Phone", "Medicine", "Batch", "Quantity",
      "Rate Incl GST", "GST Rate", "Taxable Value", "CGST", "SGST", "Invoice Total",
    ]),
    ...report.sales.map((sale) => {
      const medicine = report.medicinesById[sale.medicineId] || {};
      const gstRate = Number(medicine.gstRate ?? 5);
      const total = Number(sale.quantity || 0) * Number(sale.sellingPrice || 0);
      const taxable = gstRate ? (total * 100) / (100 + gstRate) : total;
      const gst = total - taxable;
      return csvRow([
        `PS-${sale.id}`, sale.saleDate, sale.customerPhone,
        medicine.name || "Unknown", medicine.batchNo, sale.quantity,
        Number(sale.sellingPrice || 0).toFixed(2), `${gstRate}%`,
        taxable.toFixed(2), (gst / 2).toFixed(2), (gst / 2).toFixed(2),
        total.toFixed(2),
      ]);
    }),
  ];

  const purchaseRows = () => [
    csvRow(["Purchase ID", "Date", "Supplier", "Medicine", "Quantity", "Unit Cost", "Total Cost"]),
    ...report.purchases.map((purchase) =>
      csvRow([
        purchase.id, purchase.purchaseDate,
        report.suppliersById[purchase.supplierId]?.name || "Unknown",
        report.medicinesById[purchase.medicineId]?.name || "Unknown",
        purchase.quantity, Number(purchase.purchasePrice || 0).toFixed(2),
        (Number(purchase.quantity || 0) * Number(purchase.purchasePrice || 0)).toFixed(2),
      ])
    ),
  ];

  const inventoryRows = () => [
    csvRow(["Medicine ID", "Medicine", "Brand", "Batch", "Expiry", "GST Rate", "MRP", "Stock", "Stock MRP Value"]),
    ...records.medicines.map((medicine) =>
      csvRow([
        medicine.id, medicine.name, medicine.brand, medicine.batchNo,
        medicine.expiryDate, `${Number(medicine.gstRate ?? 5)}%`,
        Number(medicine.mrp || 0).toFixed(2), medicine.stockQuantity,
        (Number(medicine.mrp || 0) * Number(medicine.stockQuantity || 0)).toFixed(2),
      ])
    ),
  ];

  const supplierRows = () => [
    csvRow(["Supplier ID", "Name", "Phone", "Email", "Address"]),
    ...records.suppliers.map((supplier) =>
      csvRow([supplier.id, supplier.name, supplier.phone, supplier.email, supplier.address])
    ),
  ];

  const downloadTradingReport = () => {
    downloadCsv(`PharmaSathi-Trading-PnL-${periodSuffix}.csv`, [
      csvRow(["PHARMASATHI ESTIMATED TRADING AND PROFIT & LOSS"]),
      csvRow(["Period From", fromDate || "All records"]),
      csvRow(["Period To", toDate || "All records"]),
      "",
      csvRow(["Sales Revenue", report.revenue.toFixed(2)]),
      csvRow(["Purchase Cost", report.purchaseCost.toFixed(2)]),
      csvRow(["Estimated Gross Profit", tradingGrossProfit.toFixed(2)]),
      csvRow(["Rent Expense", accountNumber("rentExpense").toFixed(2)]),
      csvRow(["Salary Expense", accountNumber("salaryExpense").toFixed(2)]),
      csvRow(["Electricity Expense", accountNumber("electricityExpense").toFixed(2)]),
      csvRow(["Bank / Payment Charges", accountNumber("bankCharges").toFixed(2)]),
      csvRow(["Professional Fees", accountNumber("professionalFees").toFixed(2)]),
      csvRow(["Bad Debts / Write-offs", accountNumber("badDebts").toFixed(2)]),
      csvRow(["Other Business Expenses", accountNumber("otherExpense").toFixed(2)]),
      csvRow(["Estimated Net Profit", netProfit.toFixed(2)]),
      csvRow(["Output GST Included", report.totalGst.toFixed(2)]),
      csvRow(["Opening Stock at Cost", accountNumber("openingStock").toFixed(2)]),
      csvRow(["Closing Stock Value Used", closingStockValue.toFixed(2)]),
      "",
      csvRow(["Note", "Management estimate only. CA must verify stock valuation, input GST, expenses and statutory adjustments."]),
    ]);
  };

  const downloadBalanceSheet = () => {
    downloadCsv(`PharmaSathi-Balance-Sheet-${periodSuffix}.csv`, [
      csvRow([accounts.businessName || "PHARMASATHI", "ESTIMATED BALANCE SHEET"]),
      csvRow(["Owner", accounts.ownerName]),
      csvRow(["PAN", accounts.pan]),
      csvRow(["GSTIN", accounts.gstin]),
      csvRow(["Period", `${fromDate || "All"} to ${toDate || "All"}`]),
      "",
      csvRow(["LIABILITIES", "AMOUNT", "ASSETS", "AMOUNT"]),
      csvRow(["Capital", accountNumber("openingCapital").toFixed(2), "Cash in Hand", accountNumber("cashBalance").toFixed(2)]),
      csvRow(["Add: Net Profit", netProfit.toFixed(2), "Bank Balance", accountNumber("bankBalance").toFixed(2)]),
      csvRow(["Less: Drawings", accountNumber("drawings").toFixed(2), "Customer Debtors", accountNumber("customerDues").toFixed(2)]),
      csvRow(["Supplier Creditors", accountNumber("supplierDues").toFixed(2), "Closing Stock at MRP", report.stockValue.toFixed(2)]),
      csvRow(["Customer Advances", accountNumber("customerAdvances").toFixed(2), "Advances to Suppliers", accountNumber("advanceToSuppliers").toFixed(2)]),
      csvRow(["Secured Loans", accountNumber("securedLoans").toFixed(2), "Closing Stock", closingStockValue.toFixed(2)]),
      csvRow(["Unsecured Loans", accountNumber("unsecuredLoans").toFixed(2), "Fixed Assets Net", Math.max(0, accountNumber("fixedAssets") - accountNumber("depreciation")).toFixed(2)]),
      csvRow(["GST Payable", accountNumber("gstPayable").toFixed(2), "Input GST / ITC", accountNumber("inputGst").toFixed(2)]),
      csvRow(["TDS Payable", accountNumber("tdsPayable").toFixed(2), "TDS Receivable", accountNumber("tdsReceivable").toFixed(2)]),
      csvRow(["Outstanding Expenses", accountNumber("outstandingExpenses").toFixed(2), "Prepaid Expenses", accountNumber("prepaidExpenses").toFixed(2)]),
      csvRow(["TOTAL LIABILITIES", totalLiabilities.toFixed(2), "TOTAL ASSETS", totalAssets.toFixed(2)]),
      csvRow(["BALANCING DIFFERENCE", balanceDifference.toFixed(2)]),
      "",
      csvRow(["CA NOTE", "Verify stock at cost/NRV, depreciation, GST reconciliation, receivables/payables and opening balances before finalisation."]),
    ]);
  };

  const downloadCaPackage = () => {
    downloadCsv(`PharmaSathi-CA-Package-${periodSuffix}.csv`, [
      csvRow(["BUSINESS PROFILE"]),
      ...accountFields.map(([name, label]) => csvRow([label, accounts[name]])),
      "",
      csvRow(["TRADING AND P&L SUMMARY"]),
      csvRow(["Sales Revenue", report.revenue.toFixed(2)]),
      csvRow(["Purchase Cost", report.purchaseCost.toFixed(2)]),
      csvRow(["Gross Profit", tradingGrossProfit.toFixed(2)]),
      csvRow(["Total Expenses", totalExpenses.toFixed(2)]),
      csvRow(["Net Profit", netProfit.toFixed(2)]),
      "",
      csvRow(["BALANCE SHEET SUMMARY"]),
      csvRow(["Total Assets", totalAssets.toFixed(2)]),
      csvRow(["Total Liabilities", totalLiabilities.toFixed(2)]),
      csvRow(["Difference Requiring Reconciliation", balanceDifference.toFixed(2)]),
      "",
      csvRow(["COMPLIANCE RECONCILIATION"]),
      csvRow(["Output GST as per Sales", report.totalGst.toFixed(2)]),
      csvRow(["GST Paid entered", accountNumber("outputGstPaid").toFixed(2)]),
      csvRow(["Input GST / ITC entered", accountNumber("inputGst").toFixed(2)]),
      csvRow(["GST Payable entered", accountNumber("gstPayable").toFixed(2)]),
      csvRow(["Closing Stock at Cost", closingStockValue.toFixed(2)]),
      "",
      csvRow(["SALES REGISTER"]),
      ...salesRows(),
      "",
      csvRow(["PURCHASE REGISTER"]),
      ...purchaseRows(),
      "",
      csvRow(["INVENTORY REGISTER"]),
      ...inventoryRows(),
      "",
      csvRow(["SUPPLIER MASTER"]),
      ...supplierRows(),
    ]);
  };

  const downloadAuditReport = () => {
    const rows = [
      csvRow(["PHARMASATHI AUDIT REPORT"]),
      csvRow(["Period From", fromDate || "All records"]),
      csvRow(["Period To", toDate || "All records"]),
      csvRow(["Generated On", new Date().toLocaleString("en-IN")]),
      "",
      csvRow(["SUMMARY"]),
      csvRow(["Total Sales", report.sales.length]),
      csvRow(["Sales Revenue", report.revenue.toFixed(2)]),
      csvRow(["Total Purchases", report.purchases.length]),
      csvRow(["Purchase Cost", report.purchaseCost.toFixed(2)]),
      csvRow(["Gross Profit", report.grossProfit.toFixed(2)]),
      csvRow(["Output GST Included", report.totalGst.toFixed(2)]),
      csvRow(["Current Stock MRP Value", report.stockValue.toFixed(2)]),
      "",
      csvRow(["SALES REGISTER"]),
      ...salesRows(),
      "",
      csvRow(["PURCHASE REGISTER"]),
      ...purchaseRows(),
      "",
      csvRow(["INVENTORY REGISTER"]),
      ...inventoryRows(),
      "",
      csvRow(["SUPPLIER MASTER"]),
      ...supplierRows(),
    ];

    downloadCsv(`PharmaSathi-Audit-${periodSuffix}.csv`, rows);
  };

  if (loading) {
    return <div className="report-page report-state">Report load ho raha hai...</div>;
  }

  return (
    <main className="report-page">
      <section className="report-header">
        <div>
          <p>Accounts and compliance</p>
          <h1>Audit Report</h1>
          <span>CA-ready sales, purchase, GST and inventory records</span>
        </div>
        <button type="button" className="report-download-btn" onClick={downloadAuditReport}>
          <i className="bi bi-download"></i>
          Download Audit CSV
        </button>
      </section>

      {error && <div className="report-error">{error}</div>}

      <section className="report-filter">
        <label>
          <span>From Date</span>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          <span>To Date</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
        <button type="button" onClick={() => { setFromDate(""); setToDate(""); }}>
          Clear Dates
        </button>
      </section>

      <section className="report-metrics">
        <ReportMetric label="Sales Revenue" value={money(report.revenue)} tone="blue" />
        <ReportMetric label="Purchase Cost" value={money(report.purchaseCost)} tone="orange" />
        <ReportMetric label="Trading Gross Profit" value={money(tradingGrossProfit)} tone="green" />
        <ReportMetric label="Output GST" value={money(report.totalGst)} tone="violet" />
      </section>

      <section className="report-summary">
        <div><span>Sales Bills</span><strong>{report.sales.length}</strong></div>
        <div><span>Purchase Entries</span><strong>{report.purchases.length}</strong></div>
        <div><span>Medicines</span><strong>{records.medicines.length}</strong></div>
        <div><span>Suppliers</span><strong>{records.suppliers.length}</strong></div>
        <div><span>Stock MRP Value</span><strong>{money(report.stockValue)}</strong></div>
      </section>

      <section className="report-registers">
        <button type="button" onClick={() => downloadCsv(`Sales-Register-${periodSuffix}.csv`, salesRows())}>
          <i className="bi bi-receipt"></i>
          <span>Sales register with invoice-wise GST breakup</span>
          <b>Download</b>
        </button>
        <button type="button" onClick={() => downloadCsv(`Purchase-Register-${periodSuffix}.csv`, purchaseRows())}>
          <i className="bi bi-cart-check"></i>
          <span>Purchase register with supplier and medicine details</span>
          <b>Download</b>
        </button>
        <button type="button" onClick={() => downloadCsv("Inventory-Register.csv", inventoryRows())}>
          <i className="bi bi-capsule"></i>
          <span>Inventory register with batch, expiry, GST and stock value</span>
          <b>Download</b>
        </button>
        <button type="button" onClick={() => downloadCsv("Supplier-Master.csv", supplierRows())}>
          <i className="bi bi-building"></i>
          <span>Complete supplier master for verification</span>
          <b>Download</b>
        </button>
      </section>

      <section className="report-balance">
        <div>
          <p>CA Financial Statement</p>
          <h2>Estimated Trading & Profit/Loss</h2>
          <span>नीचे Accounts Setup में details भरने के बाद financial statements download करें.</span>
        </div>
        <button type="button" onClick={downloadTradingReport}>
          <i className="bi bi-file-earmark-spreadsheet"></i>
          Download P&L
        </button>
        <button type="button" onClick={downloadBalanceSheet}>
          <i className="bi bi-bank"></i>
          Balance Sheet
        </button>
      </section>

      <section className="accounts-setup">
        <div className="accounts-setup-heading">
          <div>
            <p>Owner configuration</p>
            <h2>Accounts Setup</h2>
            <span>ये details इस device पर automatically save रहेंगी.</span>
          </div>
          <button type="button" onClick={downloadCaPackage}>
            <i className="bi bi-file-earmark-zip"></i>
            Download Complete CA Package
          </button>
        </div>
        <div className="accounts-field-grid">
          {accountFields.map(([name, label, type]) => (
            <label key={name}>
              <span>{label}</span>
              <input
                type={type}
                min={type === "number" ? "0" : undefined}
                step={type === "number" ? "0.01" : undefined}
                value={accounts[name]}
                onChange={(e) =>
                  setAccounts((previous) => ({ ...previous, [name]: e.target.value }))
                }
                placeholder={type === "number" ? "0.00" : label}
              />
            </label>
          ))}
        </div>
        <div className="accounts-totals">
          <div><span>Net Profit</span><strong>{money(netProfit)}</strong></div>
          <div><span>Total Assets</span><strong>{money(totalAssets)}</strong></div>
          <div><span>Total Liabilities</span><strong>{money(totalLiabilities)}</strong></div>
          <div className={Math.abs(balanceDifference) < 0.01 ? "balanced" : "unbalanced"}>
            <span>Difference</span><strong>{money(balanceDifference)}</strong>
          </div>
        </div>
      </section>

      <aside className="balance-sheet-note">
        <strong>CA verification जरूरी है</strong>
        <span>Closing stock अभी MRP value पर है; final accounts में CA इसे cost या applicable valuation method पर adjust करेगा. Depreciation, bad debts, GST reconciliation और year-end provisions भी CA verify करेगा.</span>
      </aside>

      <section className="audit-readiness">
        <h2>Audit Readiness Checklist</h2>
        <div>
          <AuditCheck label="Business identity, PAN and GSTIN" ready={Boolean(accounts.businessName && accounts.pan)} />
          <AuditCheck label="Drug licence and pharmacist details" ready={Boolean(accounts.drugLicense && accounts.pharmacistName)} />
          <AuditCheck label="Opening and closing stock at cost" ready={accountNumber("closingStockCost") > 0} />
          <AuditCheck label="Cash and bank balances" ready={accounts.cashBalance !== "" && accounts.bankBalance !== ""} />
          <AuditCheck label="Debtors and creditors" ready={accounts.customerDues !== "" && accounts.supplierDues !== ""} />
          <AuditCheck label="GST input, paid and payable reconciliation" ready={accounts.inputGst !== "" && accounts.gstPayable !== ""} />
          <AuditCheck label="Expense and depreciation records" ready={accounts.depreciation !== "" && totalExpenses >= 0} />
          <AuditCheck label="Balance Sheet reconciled" ready={Math.abs(balanceDifference) < 0.01} />
        </div>
      </section>
    </main>
  );
}

function ReportMetric({ label, value, tone }) {
  return (
    <article className={`report-metric report-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AuditCheck({ label, ready }) {
  return (
    <div className={ready ? "audit-check ready" : "audit-check pending"}>
      <i className={`bi ${ready ? "bi-check-circle-fill" : "bi-exclamation-circle"}`}></i>
      <span>{label}</span>
      <strong>{ready ? "Ready" : "Pending"}</strong>
    </div>
  );
}

export default Report;
