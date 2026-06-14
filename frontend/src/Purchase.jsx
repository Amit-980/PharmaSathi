import { useEffect, useState } from "react";
import api from "./api";
import ShopFlow from "./ShopFlow";

function Purchase({ onNavigate }) {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState({
    medicineId: "",
    supplierId: "",
    invoiceNumber: "",
    quantity: "",
    purchasePrice: "",
    discountPercent: "0",
    paymentStatus: "PAID",
    purchaseDate: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMedicines();
    loadSuppliers();
    loadPurchases();
  }, []);

  async function loadMedicines() {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    }
  }

  async function loadSuppliers() {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  }

  async function loadPurchases() {
    try {
      const response = await api.get("/purchases");
      setPurchases(response.data);
    } catch (error) {
      console.error("Error loading purchases:", error);
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
      await api.post("/purchases", {
        medicineId: parseInt(formData.medicineId),
        supplierId: parseInt(formData.supplierId),
        invoiceNumber: formData.invoiceNumber,
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        discountPercent: parseFloat(formData.discountPercent || 0),
        paymentStatus: formData.paymentStatus,
        purchaseDate: formData.purchaseDate,
      });

      setSuccessMessage("Purchase added successfully!");
      setFormData({
        medicineId: "",
        supplierId: "",
        invoiceNumber: "",
        quantity: "",
        purchasePrice: "",
        discountPercent: "0",
        paymentStatus: "PAID",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      loadPurchases();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Error adding purchase"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      try {
        await api.delete(`/purchases/${id}`);
        setSuccessMessage("Purchase deleted successfully!");
        loadPurchases();
      } catch {
        setErrorMessage("Error deleting purchase");
      }
    }
  };

  const getMedicineName = (id) => {
    const medicine = medicines.find((m) => m.id === id);
    return medicine ? medicine.name : "Unknown";
  };

  const getSupplierName = (id) => {
    const supplier = suppliers.find((s) => s.id === id);
    return supplier ? supplier.name : "Unknown";
  };

  const totalPurchaseValue = purchases.reduce(
    (sum, purchase) =>
      sum + Number(purchase.quantity || 0) * Number(purchase.purchasePrice || 0),
    0
  );
  const totalPurchasedUnits = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.quantity || 0),
    0
  );
  const latestPurchaseDate = purchases
    .map((purchase) => purchase.purchaseDate)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="purchase-container module-page purchase-page min-vh-100 py-5">
      <div className="container-fluid">
        <ShopFlow active="purchase" onNavigate={onNavigate} />
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-box-arrow-in-down"></i> Supplier se Aaya Maal
          </h1>
          <p className="text-white-50 fs-5">Jo dawa kharidkar dukaan mein aayi hai, uski quantity yahan darj karein</p>
          <span className="module-chip">{purchases.length} inward entries</span>
        </div>

        <div className="module-insight-grid module-insight-grid-three">
          <div><span>Total Purchase Value</span><strong>₹{totalPurchaseValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>
          <div><span>Stock Received</span><strong>{totalPurchasedUnits} units</strong></div>
          <div><span>Latest Inward</span><strong>{latestPurchaseDate || "No purchase"}</strong></div>
        </div>

        <div className="module-purpose-note">
          <i className="bi bi-box-seam"></i>
          <div><strong>Is screen ka kaam: stock badhana (+)</strong><span>Pehle se bani dawa aur supplier chunein. Quantity save karte hi available stock apne-aap badhega.</span></div>
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
            <div className="card gradient-card gradient-green shadow-lg border-0 sticky-lg-top" style={{ top: "20px" }}>
              <div className="card-header bg-transparent border-0 p-4">
                <h5 className="text-white mb-0">
                  <i className="bi bi-plus-circle me-2"></i>
                  Aaya Hua Maal Stock Mein Jodein
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Supplier Invoice Number</label>
                    <input className="form-control form-control-lg" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} placeholder="Auto-generated if blank" />
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
                          {med.name} - {med.brand} (Stock: {med.stockQuantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <label className="form-label text-white fw-600">Discount %</label>
                      <input type="number" min="0" max="100" step="0.01" className="form-control" name="discountPercent" value={formData.discountPercent} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-white fw-600">Payment</label>
                      <select className="form-select" name="paymentStatus" value={formData.paymentStatus} onChange={handleChange}>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-building me-2"></i>Supplier
                    </label>
                    <select
                      className="form-control form-control-lg"
                      name="supplierId"
                      value={formData.supplierId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
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
                      <i className="bi bi-cash me-2"></i>Purchase Price per Unit
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-calendar me-2"></i>Purchase Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      name="purchaseDate"
                      value={formData.purchaseDate}
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
                      {loading ? "Adding Stock..." : "Add Stock Purchase"}
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
                  <i className="bi bi-history me-2 text-success"></i>
                  Stock Inward History
                </h5>
                <small className="text-muted">Total: {purchases.length} purchases</small>
              </div>
              <div className="card-body p-0">
                {purchases.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-inbox fs-1"></i>
                    <p className="mt-3 mb-0">No purchases recorded yet. Start by recording a purchase!</p>
                  </div>
                ) : (
                  <div className="record-card-grid">
                    {purchases.map((purchase) => {
                      const gross =
                        Number(purchase.quantity || 0) *
                        Number(purchase.purchasePrice || 0);
                      const total = gross * (1 - Number(purchase.discountPercent || 0) / 100);

                      return (
                        <article className="record-card purchase-record-card" key={purchase.id}>
                          <div className="record-card-title">
                            <span>{purchase.invoiceNumber || `Purchase #${purchase.id}`}</span>
                            <strong>{getMedicineName(purchase.medicineId)}</strong>
                            <small>{getSupplierName(purchase.supplierId)}</small>
                          </div>
                          <div className="record-card-details">
                            <div>
                              <small>Quantity</small>
                              <strong>{purchase.quantity} units</strong>
                            </div>
                            <div>
                              <small>Unit Price</small>
                              <strong>₹{Number(purchase.purchasePrice || 0).toFixed(2)}</strong>
                            </div>
                            <div>
                              <small>Total</small>
                              <strong>₹{total.toFixed(2)}</strong>
                            </div>
                            <div>
                              <small>Date</small>
                              <strong className="record-date">{purchase.purchaseDate || "-"}</strong>
                            </div>
                            <div><small>Payment</small><strong>{purchase.paymentStatus || "PAID"}</strong></div>
                          </div>
                          <div className="record-card-actions">
                            <button
                              className="btn btn-outline-danger"
                              type="button"
                              onClick={() => handleDelete(purchase.id)}
                            >
                              <i className="bi bi-trash"></i> Delete Purchase
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
      </div>
    </div>
  );
}

export default Purchase;
