import { useEffect, useState } from "react";
import axios from "axios";

const emptySaleForm = {
  customerPhone: "",
  medicineId: "",
  quantity: "",
  sellingPrice: "",
  saleDate: new Date().toISOString().split("T")[0],
};

function Sale() {
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

  const loadMedicines = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    }
  };

  const loadSales = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/sales");
      setSales(response.data);
    } catch (error) {
      console.error("Error loading sales:", error);
    }
  };

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
        customerPhone: formData.customerPhone.trim(),
        medicineId: parseInt(formData.medicineId),
        quantity: parseInt(formData.quantity),
        sellingPrice: parseFloat(formData.sellingPrice),
        saleDate: formData.saleDate,
      };

      const response = await axios.post("http://localhost:8080/api/sales", salePayload);
      const savedSale = { ...salePayload, ...(response.data || {}) };

      setBill(
        createBill({
          sale: { ...savedSale, id: savedSale.id || Date.now() },
          medicine: selectedMedicine,
        })
      );

      setSuccessMessage("Sale recorded successfully! Bill ready hai.");
      setFormData(emptySaleForm);
      setSales((prev) => [{ ...savedSale, id: savedSale.id || Date.now() }, ...prev]);
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
        await axios.delete(`http://localhost:8080/api/sales/${id}`);
        setSuccessMessage("Sale deleted successfully!");
        loadSales();
      } catch (error) {
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
    const total = quantity * rate;

    return {
      billNo: `PS-${String(sale.id || Date.now()).padStart(5, "0")}`,
      date: sale.saleDate,
      customerPhone: sale.customerPhone || customerPhone || "-",
      medicineName: medicine?.name || getMedicineName(sale.medicineId),
      brand: medicine?.brand || "-",
      batchNo: medicine?.batchNo || "-",
      expiryDate: medicine?.expiryDate || "-",
      quantity,
      rate,
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

  return (
    <div className="sale-container module-page sale-page min-vh-100 py-5">
      <div className="container-fluid">
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-cart-check"></i> Sales Record
          </h1>
          <p className="text-white-50 fs-5">Record medicine sales with real-time stock management</p>
          <span className="module-chip">{sales.length} sales</span>
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
          <div className="col-lg-5">
            <div className="card gradient-card gradient-blue shadow-lg border-0 sticky-lg-top" style={{ top: "20px" }}>
              <div className="card-header bg-transparent border-0 p-4">
                <h5 className="text-white mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Record New Sale
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
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
                      {loading ? "Recording..." : "Record Sale"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="col-lg-7">
            <div className="card shadow-lg border-0">
              <div className="card-header bg-light border-bottom p-4">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-receipt me-2 text-primary"></i>
                  Sale History
                </h5>
                <small className="text-muted">Total: {sales.length} sales</small>
              </div>
              <div className="sale-search-bar">
                <div>
                  <label className="form-label">Search by mobile or medicine</label>
                  <input
                    type="search"
                    className="form-control"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Mobile number ya medicine name"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary align-self-end"
                  onClick={() => setSearchQuery("")}
                >
                  Clear
                </button>
                <div className="sale-search-summary">
                  <strong>{filteredSales.length}</strong>
                  <span>results</span>
                  <b>₹{totalFilteredAmount.toFixed(2)}</b>
                </div>
              </div>
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
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">#</th>
                          <th className="fw-bold">
                            <i className="bi bi-pill me-2"></i>Medicine
                          </th>
                          <th className="fw-bold">Mobile</th>
                          <th className="fw-bold">Qty</th>
                          <th className="fw-bold">Price</th>
                          <th className="fw-bold">Total</th>
                          <th className="fw-bold">Date</th>
                          <th className="fw-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((sale) => (
                          <tr key={sale.id} className="align-middle">
                            <td className="fw-bold text-primary">{sale.id}</td>
                            <td>{getMedicineName(sale.medicineId)}</td>
                            <td>{sale.customerPhone || "-"}</td>
                            <td>
                              <span className="badge bg-warning text-dark">{sale.quantity} units</span>
                            </td>
                            <td>
                              <span className="badge bg-success">₹{sale.sellingPrice}</span>
                            </td>
                            <td className="fw-bold">
                              ₹{(sale.quantity * sale.sellingPrice).toFixed(2)}
                            </td>
                            <td>
                              <small className="text-muted">{sale.saleDate}</small>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewBill(sale)}
                                title="Generate bill"
                              >
                                <i className="bi bi-receipt"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(sale.id)}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {bill && (
          <div className="bill-backdrop">
            <div className="bill-card printable-bill">
              <div className="bill-top">
                <div>
                  <p className="bill-kicker">Pharmacy invoice</p>
                  <h2>PharmaSathi</h2>
                  <span>Medicine Sale Bill</span>
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
                <div className="bill-row bill-head">
                  <span>Medicine</span>
                  <span>Batch</span>
                  <span>Expiry</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Total</span>
                </div>
                <div className="bill-row">
                  <span>
                    <strong>{bill.medicineName}</strong>
                    <small>{bill.brand}</small>
                  </span>
                  <span>{bill.batchNo}</span>
                  <span>{bill.expiryDate}</span>
                  <span>{bill.quantity}</span>
                  <span>₹{bill.rate.toFixed(2)}</span>
                  <span>₹{bill.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bill-total">
                <span>Grand Total</span>
                <strong>₹{bill.total.toFixed(2)}</strong>
              </div>

              <div className="bill-footer">
                <p>Thank you for choosing PharmaSathi.</p>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Sale;
