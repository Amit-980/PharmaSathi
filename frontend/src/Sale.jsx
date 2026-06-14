import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "./api";
import ShopFlow from "./ShopFlow";

const emptySaleForm = {
  customerName: "",
  customerPhone: "",
  customerGstin: "",
  medicineId: "",
  quantity: "",
  sellingPrice: "",
  discountPercent: "0",
  paymentMode: "CASH",
  paymentStatus: "PAID",
  saleDate: new Date().toISOString().split("T")[0],
};

function Sale({ onNavigate }) {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [formData, setFormData] = useState(emptySaleForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMedicines();
    loadSales();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("bill-open", Boolean(bill));

    return () => {
      document.body.classList.remove("bill-open");
    };
  }, [bill]);

  useEffect(() => {
    const originalTitle = document.title;
    const hidePrintHeader = () => {
      document.title = "";
    };
    const restoreTitle = () => {
      document.title = originalTitle;
    };

    window.addEventListener("beforeprint", hidePrintHeader);
    window.addEventListener("afterprint", restoreTitle);

    return () => {
      window.removeEventListener("beforeprint", hidePrintHeader);
      window.removeEventListener("afterprint", restoreTitle);
      document.title = originalTitle;
    };
  }, []);

  async function loadMedicines() {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    }
  }

  async function loadSales() {
    try {
      const response = await api.get("/sales");
      setSales(response.data);
    } catch (error) {
      console.error("Error loading sales:", error);
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const selectedMedicine = medicines.find(
        (m) => m.id === parseInt(formData.medicineId)
      );

      if (!selectedMedicine) {
        setErrorMessage("Please select a valid medicine");
        setLoading(false);
        return;
      }

      if (parseInt(formData.quantity) > selectedMedicine.stockQuantity) {
        setErrorMessage(
          `Insufficient stock! Available: ${selectedMedicine.stockQuantity}`
        );
        setLoading(false);
        return;
      }

      if (!/^[0-9]{10}$/.test(formData.customerPhone)) {
        setErrorMessage("Customer mobile number 10 digits ka hona chahiye");
        setLoading(false);
        return;
      }

      const salePayload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerGstin: formData.customerGstin.trim(),
        medicineId: parseInt(formData.medicineId),
        quantity: parseInt(formData.quantity),
        sellingPrice: parseFloat(formData.sellingPrice),
        discountPercent: parseFloat(formData.discountPercent || 0),
        paymentMode: formData.paymentMode,
        paymentStatus: formData.paymentStatus,
        saleDate: formData.saleDate,
      };

      const response = await api.post("/sales", salePayload);
      const savedSale = { ...salePayload, ...(response.data || {}) };

      const fallbackId = sales.length + 1;
      setBill(
        createBill({
          sale: { ...savedSale, id: savedSale.id || fallbackId },
          medicine: selectedMedicine,
        })
      );

      setSuccessMessage("Sale recorded successfully! Bill ready hai.");
      setFormData(emptySaleForm);
      setSales((prev) => [{ ...savedSale, id: savedSale.id || fallbackId }, ...prev]);
      loadMedicines();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Error recording sale"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sale?")) {
      try {
        await api.delete(`/sales/${id}`);
        setSuccessMessage("Sale deleted successfully!");
        loadSales();
      } catch {
        setErrorMessage("Error deleting sale");
      }
    }
  };

  const getMedicineName = (id) => {
    const medicine = medicines.find((m) => m.id === id);
    return medicine ? medicine.name : "Unknown";
  };

  const getMedicineById = (id) => {
    return medicines.find((m) => m.id === id);
  };

  const createBill = ({ sale, medicine, customerPhone = "" }) => {
    const quantity = Number(sale.quantity || 0);
    const rate = Number(sale.sellingPrice || 0);
    const gross = quantity * rate;
    const discountPercent = Number(sale.discountPercent || 0);
    const total = gross * (1 - discountPercent / 100);
    const gstRate = Number(medicine?.gstRate ?? 5);
    const taxableAmount =
      gstRate > 0 ? (total * 100) / (100 + gstRate) : total;
    const gstAmount = total - taxableAmount;
    const cgstAmount = gstAmount / 2;
    const sgstAmount = gstAmount / 2;

    return {
      billNo: sale.invoiceNumber || `PS-${String(sale.id || "DRAFT").padStart(5, "0")}`,
      date: sale.saleDate,
      customerName: sale.customerName || "-",
      customerPhone: sale.customerPhone || customerPhone || "-",
      customerGstin: sale.customerGstin || "-",
      medicineName: medicine?.name || getMedicineName(sale.medicineId),
      brand: medicine?.brand || "-",
      batchNo: medicine?.batchNo || "-",
      expiryDate: medicine?.expiryDate || "-",
      quantity,
      rate,
      discountPercent,
      gstRate,
      taxableAmount,
      gstAmount,
      cgstAmount,
      sgstAmount,
      total,
    };
  };

  const handleViewBill = (sale) => {
    setBill(
      createBill({
        sale,
        medicine: getMedicineById(sale.medicineId),
      })
    );
  };

  const handlePrintSaleBill = (sale) => {
    handleViewBill(sale);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintBill = () => {
    window.print();
  };

  const filteredSales = [...sales]
    .sort((a, b) => new Date(b.saleDate || 0) - new Date(a.saleDate || 0))
    .filter((sale) => {
      const query = searchQuery.trim().toLowerCase();
      return (
      !query ||
      (sale.customerPhone || "").includes(query) ||
        getMedicineName(sale.medicineId).toLowerCase().includes(query)
      );
    });

  const totalFilteredAmount = filteredSales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
    0
  );
  const customerSearch = searchQuery.trim();
  const searchedByPhone = /^[0-9]{4,10}$/.test(customerSearch);
  const latestFilteredSale = filteredSales[0];
  const todayKey = new Date().toISOString().split("T")[0];
  const todaySales = sales.filter((sale) => sale.saleDate === todayKey);
  const todayRevenue = todaySales.reduce(
    (sum, sale) =>
      sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
    0
  );
  const todayUnits = todaySales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0),
    0
  );

  return (
    <div className="sale-container module-page sale-page min-vh-100 py-5">
      <div className="container-fluid">
        <div className="module-open-guide">
          <i className="bi bi-receipt"></i>
          <div><small>SALES & BILLING</small><strong>Customer ko dawa bechte samay bill yahan banayein</strong><span>Customer, medicine, quantity aur selling rate enter karein. Invoice banega aur bechi gayi quantity stock se automatically kam ho jayegi.</span></div>
        </div>
        <ShopFlow active="sale" onNavigate={onNavigate} />
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-cart-check"></i> Sales & Billing
          </h1>
          <p className="text-white-50 fs-5">Create customer invoices and automatically update available stock</p>
          <span className="module-chip">{sales.length} sales</span>
        </div>

        <div className="module-insight-grid module-insight-grid-three">
          <div><span>Today's Bills</span><strong>{todaySales.length}</strong></div>
          <div><span>Today's Revenue</span><strong>₹{todayRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>
          <div><span>Units Sold Today</span><strong>{todayUnits}</strong></div>
        </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show shadow-lg border-0">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage("")}
            ></button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show shadow-lg border-0">
            <i className="bi bi-exclamation-circle me-2"></i>
            {errorMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setErrorMessage("")}
            ></button>
          </div>
        )}

        <div className="row g-4">
          {/* Form Section */}
          <div className="col-xl-4">
            <div className="card gradient-card gradient-blue shadow-lg border-0 sticky-lg-top" style={{ top: "20px" }}>
              <div className="card-header bg-transparent border-0 p-4">
                <h5 className="text-white mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Naya Customer Bill
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Customer / Firm Name</label>
                    <input className="form-control form-control-lg" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Retailer or firm name" required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-phone me-2"></i>Customer Phone
                    </label>
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="10 digit mobile number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      inputMode="numeric"
                      required
                    />
                    <small className="text-white-50 d-block mt-2">
                      Mobile number exactly 10 digits hona chahiye.
                    </small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Customer GSTIN</label>
                    <input className="form-control form-control-lg" name="customerGstin" value={formData.customerGstin} onChange={handleChange} placeholder="Optional for unregistered customer" />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-pill me-2"></i>Medicine
                    </label>
                    <select
                      className="form-control form-control-lg"
                      name="medicineId"
                      value={formData.medicineId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Medicine</option>
                      {medicines.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.name} - {med.brand} (Stock:{" "}
                          {med.stockQuantity}, MRP: ₹{med.mrp})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-4">
                      <label className="form-label text-white fw-600">Discount %</label>
                      <input type="number" min="0" max="100" step="0.01" className="form-control" name="discountPercent" value={formData.discountPercent} onChange={handleChange} />
                    </div>
                    <div className="col-4">
                      <label className="form-label text-white fw-600">Mode</label>
                      <select className="form-select" name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                        {["CASH", "UPI", "CARD", "BANK", "CREDIT"].map((mode) => <option key={mode}>{mode}</option>)}
                      </select>
                    </div>
                    <div className="col-4">
                      <label className="form-label text-white fw-600">Status</label>
                      <select className="form-select" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-boxes me-2"></i>Quantity
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-cash me-2"></i>Selling Price per Unit
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-calendar me-2"></i>Sale Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      name="saleDate"
                      value={formData.saleDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-light btn-lg fw-bold"
                      disabled={loading}
                    >
                      <i className="bi bi-check-lg me-2"></i>
                      {loading ? "Creating invoice..." : "Create Invoice"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="col-xl-8">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-light border-bottom sale-history-header">
                <div className="sale-history-heading">
                  <i className="bi bi-receipt text-primary"></i>
                  <div>
                    <h5>Sale History</h5>
                    <small>Customer invoices and recorded sales</small>
                  </div>
                </div>
                <span className="sale-history-count">
                  <strong>{sales.length}</strong>
                  {sales.length === 1 ? "Sale" : "Sales"}
                </span>
              </div>
              <div className="sale-search-bar">
                <div className="sale-mobile-search">
                  <label className="form-label">Search by customer mobile</label>
                  <div className="sale-mobile-search-input">
                    <i className="bi bi-phone"></i>
                    <input
                      type="tel"
                      className="form-control"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter mobile number"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn sale-clear-btn align-self-end"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="bi bi-x-circle"></i>
                  Clear
                </button>
                <div className="sale-search-summary">
                  <strong>{filteredSales.length}</strong>
                  <span>results</span>
                  <b>₹{totalFilteredAmount.toFixed(2)}</b>
                </div>
              </div>
              {searchedByPhone && filteredSales.length > 0 && (
                <div className="customer-sale-summary">
                  <div>
                    <small>Customer Mobile</small>
                    <strong>{customerSearch}</strong>
                  </div>
                  <div>
                    <small>Total Bills</small>
                    <strong>{filteredSales.length}</strong>
                  </div>
                  <div>
                    <small>Total Amount</small>
                    <strong>₹{totalFilteredAmount.toFixed(2)}</strong>
                  </div>
                  <div>
                    <small>Latest Sale</small>
                    <strong>{latestFilteredSale?.saleDate || "-"}</strong>
                  </div>
                </div>
              )}
              <div className="card-body p-0">
                {sales.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-inbox fs-1"></i>
                    <p className="mt-3 mb-0">No sales recorded yet. Start recording sales!</p>
                  </div>
                ) : filteredSales.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-search fs-1"></i>
                    <p className="mt-3 mb-0">Is search ke liye koi sale nahi mili.</p>
                  </div>
                ) : searchedByPhone ? (
                  <div className="customer-bill-results">
                    {filteredSales.map((sale) => {
                      const total = Number(sale.quantity || 0) * Number(sale.sellingPrice || 0);

                      return (
                        <article className="customer-bill-card" key={sale.id}>
                          <div className="customer-bill-main">
                            <span>Bill #{sale.id}</span>
                            <strong>{getMedicineName(sale.medicineId)}</strong>
                            <small>{sale.saleDate} · Mobile {sale.customerPhone || "-"}</small>
                          </div>
                          <div className="customer-bill-meta">
                            <div>
                              <small>Qty</small>
                              <strong>{sale.quantity}</strong>
                            </div>
                            <div>
                              <small>Rate</small>
                              <strong>₹{Number(sale.sellingPrice || 0).toFixed(2)}</strong>
                            </div>
                            <div>
                              <small>Total</small>
                              <strong>₹{total.toFixed(2)}</strong>
                            </div>
                          </div>
                          <div className="customer-bill-actions">
                            <button
                              className="btn sale-view-bill-btn"
                              type="button"
                              onClick={() => handleViewBill(sale)}
                            >
                              <i className="bi bi-receipt-cutoff"></i>
                              View Bill
                            </button>
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => handlePrintSaleBill(sale)}
                            >
                              Print Bill
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              type="button"
                              onClick={() => handleDelete(sale.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="sale-history-grid">
                    {filteredSales.map((sale) => {
                      const total =
                        Number(sale.quantity || 0) *
                        Number(sale.sellingPrice || 0);

                      return (
                        <article className="sale-history-card" key={sale.id}>
                          <div className="sale-history-title">
                            <span>Sale #{sale.id}</span>
                            <strong>{getMedicineName(sale.medicineId)}</strong>
                            <small>{sale.customerPhone || "No mobile number"}</small>
                          </div>

                          <div className="sale-history-details">
                            <div>
                              <small>Quantity</small>
                              <strong>{sale.quantity} units</strong>
                            </div>
                            <div>
                              <small>Unit Price</small>
                              <strong>₹{Number(sale.sellingPrice || 0).toFixed(2)}</strong>
                            </div>
                            <div>
                              <small>Total</small>
                              <strong>₹{total.toFixed(2)}</strong>
                            </div>
                            <div>
                              <small>Date</small>
                              <strong>{sale.saleDate || "-"}</strong>
                            </div>
                          </div>

                          <div className="sale-history-actions">
                            <button
                              className="btn sale-view-bill-btn"
                              type="button"
                              onClick={() => handleViewBill(sale)}
                            >
                              <i className="bi bi-receipt-cutoff"></i> View Bill
                            </button>
                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => handlePrintSaleBill(sale)}
                            >
                              Print
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              type="button"
                              onClick={() => handleDelete(sale.id)}
                            >
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {bill &&
          createPortal(
          <div className="bill-backdrop">
            <div className="bill-card printable-bill">
              <div className="bill-top">
                <div className="bill-brand">
                  <span className="bill-logo">PS</span>
                  <div>
                  <p className="bill-kicker">Pharmacy invoice</p>
                  <h2>PharmaSathi</h2>
                    <span>Medicine Sale Bill · Trusted pharmacy service</span>
                  </div>
                </div>
                <div className="invoice-seal">
                  <small>Paid Invoice</small>
                  <strong>{bill.billNo}</strong>
                </div>
                <button
                  type="button"
                  className="btn-close no-print"
                  onClick={() => setBill(null)}
                  aria-label="Close bill"
                ></button>
              </div>

              <div className="bill-meta">
                <div>
                  <small>Bill No</small>
                  <strong>{bill.billNo}</strong>
                </div>
                <div>
                  <small>Date</small>
                  <strong>{bill.date}</strong>
                </div>
                <div>
                  <small>Customer Mobile</small>
                  <strong>{bill.customerPhone}</strong>
                </div>
              </div>

              <div className="bill-table">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th>Qty</th>
                      <th>Rate (Incl. GST)</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td data-label="Medicine">
                        <strong>{bill.medicineName}</strong>
                        <small>{bill.brand}</small>
                      </td>
                      <td data-label="Batch">{bill.batchNo}</td>
                      <td data-label="Expiry">{bill.expiryDate}</td>
                      <td data-label="Qty">{bill.quantity}</td>
                      <td data-label="Rate">₹{bill.rate.toFixed(2)}</td>
                      <td data-label="Total">₹{bill.total.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bill-tax-summary">
                <div>
                  <span>Taxable Value</span>
                  <strong>₹{bill.taxableAmount.toFixed(2)}</strong>
                </div>
                <div>
                  <span>CGST ({(bill.gstRate / 2).toFixed(1)}%)</span>
                  <strong>₹{bill.cgstAmount.toFixed(2)}</strong>
                </div>
                <div>
                  <span>SGST ({(bill.gstRate / 2).toFixed(1)}%)</span>
                  <strong>₹{bill.sgstAmount.toFixed(2)}</strong>
                </div>
                <div className="bill-tax-total">
                  <span>Total GST ({bill.gstRate}%)</span>
                  <strong>₹{bill.gstAmount.toFixed(2)}</strong>
                </div>
              </div>

              <div className="bill-total">
                <div className="bill-payment-note">
                  <small>Payment Status</small>
                  <strong>Paid</strong>
                </div>
                <div className="bill-grand-total">
                  <span>Grand Total</span>
                  <strong>₹{bill.total.toFixed(2)}</strong>
                </div>
              </div>

              <div className="bill-footer">
                <div>
                  <strong>Thank you for choosing PharmaSathi.</strong>
                  <p>Prices are inclusive of GST. Please keep this invoice for reference and returns.</p>
                </div>
                <div className="bill-actions no-print">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setBill(null)}>
                    Close
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handlePrintBill}>
                    Print Bill
                  </button>
                </div>
              </div>
            </div>
          </div>,
            document.body
          )}
      </div>
    </div>
  );
}

export default Sale;
