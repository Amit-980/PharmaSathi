import { useEffect, useState } from "react";
import axios from "axios";

function Medicine() {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    batchNo: "",
    expiryDate: "",
    mrp: "",
    stockQuantity: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
      setErrorMessage("Failed to load medicines");
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
      const data = {
        name: formData.name,
        brand: formData.brand,
        batchNo: formData.batchNo,
        expiryDate: formData.expiryDate || null,
        mrp: parseFloat(formData.mrp),
        stockQuantity: parseInt(formData.stockQuantity),
      };

      if (editingId) {
        await axios.put(
          `http://localhost:8080/api/medicines/${editingId}`,
          data
        );
        setSuccessMessage("Medicine updated successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:8080/api/medicines", data);
        setSuccessMessage("Medicine added successfully!");
      }

      setFormData({
        name: "",
        brand: "",
        batchNo: "",
        expiryDate: "",
        mrp: "",
        stockQuantity: "",
      });
      loadMedicines();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Error saving medicine"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.id);
    setFormData({
      name: medicine.name,
      brand: medicine.brand,
      batchNo: medicine.batchNo,
      expiryDate: medicine.expiryDate || "",
      mrp: medicine.mrp,
      stockQuantity: medicine.stockQuantity,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      brand: "",
      batchNo: "",
      expiryDate: "",
      mrp: "",
      stockQuantity: "",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await axios.delete(`http://localhost:8080/api/medicines/${id}`);
        setSuccessMessage("Medicine deleted successfully!");
        loadMedicines();
      } catch (error) {
        setErrorMessage("Error deleting medicine");
      }
    }
  };

  return (
    <div className="medicine-container module-page medicine-page min-vh-100 py-5">
      <div className="container-fluid">
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-pill"></i> Medicine Management
          </h1>
          <p className="text-white-50 fs-5">Add, update, and manage your medicine inventory</p>
          <span className="module-chip">{medicines.length} medicines</span>
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
                  {editingId ? "Edit Medicine" : "Add New Medicine"}
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Medicine Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Aspirin"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Brand</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      placeholder="e.g., Bayer"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Batch No</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="batchNo"
                      value={formData.batchNo}
                      onChange={handleChange}
                      placeholder="e.g., BATCH123"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-calendar me-2"></i>Expiry Date
                    </label>
                    <input
                      type="date"
                      className="form-control form-control-lg"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-tag me-2"></i>MRP (₹)
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-boxes me-2"></i>Stock Quantity
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleChange}
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-light btn-lg fw-bold"
                      disabled={loading}
                    >
                      <i className="bi bi-check-lg me-2"></i>
                      {loading
                        ? "Saving..."
                        : editingId
                        ? "Update Medicine"
                        : "Add Medicine"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-outline-light btn-lg"
                        onClick={handleCancel}
                      >
                        <i className="bi bi-x-lg me-2"></i>Cancel
                      </button>
                    )}
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
                  <i className="bi bi-table me-2 text-primary"></i>
                  Medicines Inventory
                </h5>
                <small className="text-muted">Total: {medicines.length} medicines</small>
              </div>
              <div className="card-body p-0">
                {medicines.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-inbox fs-1"></i>
                    <p className="mt-3 mb-0">No medicines added yet. Start by adding a medicine!</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="fw-bold">
                            <i className="bi bi-pill me-2"></i>Name
                          </th>
                          <th className="fw-bold">Brand</th>
                          <th className="fw-bold">Batch</th>
                          <th className="fw-bold">MRP</th>
                          <th className="fw-bold">
                            <i className="bi bi-boxes me-2"></i>Stock
                          </th>
                          <th className="fw-bold">
                            <i className="bi bi-calendar me-2"></i>Expiry
                          </th>
                          <th className="fw-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((med) => (
                          <tr key={med.id} className="align-middle">
                            <td className="fw-bold">{med.name}</td>
                            <td>{med.brand}</td>
                            <td>
                              <small className="text-muted">{med.batchNo}</small>
                            </td>
                            <td>
                              <span className="badge bg-success">₹{med.mrp}</span>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  med.stockQuantity === 0
                                    ? "bg-danger"
                                    : med.stockQuantity <= 10
                                    ? "bg-warning text-dark"
                                    : "bg-success"
                                }`}
                              >
                                {med.stockQuantity} units
                              </span>
                            </td>
                            <td>
                              {med.expiryDate ? (
                                <small className="text-danger fw-bold">{med.expiryDate}</small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm" role="group">
                                <button
                                  type="button"
                                  className="btn btn-outline-primary"
                                  onClick={() => handleEdit(med)}
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => handleDelete(med.id)}
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
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

export default Medicine;
