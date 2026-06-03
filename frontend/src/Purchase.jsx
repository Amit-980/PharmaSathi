import { useEffect, useState } from "react";
import axios from "axios";

function Purchase() {
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [formData, setFormData] = useState({
    medicineId: "",
    supplierId: "",
    quantity: "",
    purchasePrice: "",
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

  const loadMedicines = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/purchases");
      setPurchases(response.data);
    } catch (error) {
      console.error("Error loading purchases:", error);
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
      await axios.post("http://localhost:8080/api/purchases", {
        medicineId: parseInt(formData.medicineId),
        supplierId: parseInt(formData.supplierId),
        quantity: parseInt(formData.quantity),
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseDate: formData.purchaseDate,
      });

      setSuccessMessage("Purchase added successfully!");
      setFormData({
        medicineId: "",
        supplierId: "",
        quantity: "",
        purchasePrice: "",
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
        await axios.delete(`http://localhost:8080/api/purchases/${id}`);
        setSuccessMessage("Purchase deleted successfully!");
        loadPurchases();
      } catch (error) {
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

  return (
    <div className="purchase-container module-page purchase-page min-vh-100 py-5">
      <div className="container-fluid">
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-arrow-up-circle"></i> Purchase Inventory
          </h1>
          <p className="text-white-50 fs-5">Record medicine purchases and manage stock intake</p>
          <span className="module-chip">{purchases.length} purchases</span>
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
                  Add New Purchase
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
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
                      {loading ? "Adding..." : "Record Purchase"}
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
                  Purchase History
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
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">#</th>
                          <th className="fw-bold">
                            <i className="bi bi-pill me-2"></i>Medicine
                          </th>
                          <th className="fw-bold">Supplier</th>
                          <th className="fw-bold">Qty</th>
                          <th className="fw-bold">Price</th>
                          <th className="fw-bold">Total</th>
                          <th className="fw-bold">Date</th>
                          <th className="fw-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((purchase) => (
                          <tr key={purchase.id} className="align-middle">
                            <td className="fw-bold text-primary">{purchase.id}</td>
                            <td>{getMedicineName(purchase.medicineId)}</td>
                            <td>{getSupplierName(purchase.supplierId)}</td>
                            <td>
                              <span className="badge bg-info">{purchase.quantity} units</span>
                            </td>
                            <td>
                              <span className="badge bg-success">₹{purchase.purchasePrice}</span>
                            </td>
                            <td className="fw-bold">
                              ₹{(purchase.quantity * purchase.purchasePrice).toFixed(2)}
                            </td>
                            <td>
                              <small className="text-muted">{purchase.purchaseDate}</small>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(purchase.id)}
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
      </div>
    </div>
  );
}

export default Purchase;
