import { useEffect, useState } from "react";
import api from "./api";
import ShopFlow from "./ShopFlow";

function Medicine({ onNavigate }) {
  const [medicines, setMedicines] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    sku: "",
    barcode: "",
    hsnCode: "",
    batchNo: "",
    unit: "Strip",
    packSize: "1",
    expiryDate: "",
    purchasePrice: "",
    wholesalePrice: "",
    mrp: "",
    gstRate: "5",
    stockQuantity: "",
    minimumStock: "10",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMedicines();
  }, []);

  async function loadMedicines() {
    try {
      const response = await api.get("/medicines");
      setMedicines(response.data);
    } catch (error) {
      console.error("Error loading medicines:", error);
      setErrorMessage("Failed to load medicines");
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
      const data = {
        name: formData.name,
        brand: formData.brand,
        sku: formData.sku,
        barcode: formData.barcode,
        hsnCode: formData.hsnCode,
        batchNo: formData.batchNo,
        unit: formData.unit,
        packSize: parseInt(formData.packSize),
        expiryDate: formData.expiryDate || null,
        purchasePrice: parseFloat(formData.purchasePrice || 0),
        wholesalePrice: parseFloat(formData.wholesalePrice || 0),
        mrp: parseFloat(formData.mrp),
        gstRate: parseFloat(formData.gstRate),
        stockQuantity: parseInt(formData.stockQuantity),
        minimumStock: parseInt(formData.minimumStock),
      };

      if (editingId) {
        await api.put(`/medicines/${editingId}`, data);
        setSuccessMessage("Medicine updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/medicines", data);
        setSuccessMessage("Medicine added successfully!");
      }

      setFormData({
        name: "",
        brand: "",
        sku: "", barcode: "", hsnCode: "",
        batchNo: "",
        unit: "Strip", packSize: "1",
        expiryDate: "",
        purchasePrice: "", wholesalePrice: "",
        mrp: "",
        gstRate: "5",
        stockQuantity: "",
        minimumStock: "10",
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
      sku: medicine.sku || "",
      barcode: medicine.barcode || "",
      hsnCode: medicine.hsnCode || "",
      batchNo: medicine.batchNo,
      unit: medicine.unit || "Strip",
      packSize: medicine.packSize ?? 1,
      expiryDate: medicine.expiryDate || "",
      purchasePrice: medicine.purchasePrice ?? "",
      wholesalePrice: medicine.wholesalePrice ?? "",
      mrp: medicine.mrp,
      gstRate: String(medicine.gstRate ?? 5),
      stockQuantity: medicine.stockQuantity,
      minimumStock: medicine.minimumStock ?? 10,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      brand: "",
      sku: "", barcode: "", hsnCode: "",
      batchNo: "",
      unit: "Strip", packSize: "1",
      expiryDate: "",
      purchasePrice: "", wholesalePrice: "",
      mrp: "",
      gstRate: "5",
      stockQuantity: "",
      minimumStock: "10",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this medicine?")) {
      try {
        await api.delete(`/medicines/${id}`);
        setSuccessMessage("Medicine deleted successfully!");
        loadMedicines();
      } catch {
        setErrorMessage("Error deleting medicine");
      }
    }
  };

  const today = new Date();
  const nearExpiryLimit = new Date(today);
  nearExpiryLimit.setDate(today.getDate() + 90);
  const lowStockCount = medicines.filter(
    (medicine) => Number(medicine.stockQuantity || 0) <= Number(medicine.minimumStock ?? 10)
  ).length;
  const nearExpiryCount = medicines.filter((medicine) => {
    if (!medicine.expiryDate) return false;
    const expiry = new Date(medicine.expiryDate);
    return expiry >= today && expiry <= nearExpiryLimit;
  }).length;
  const stockValue = medicines.reduce(
    (sum, medicine) =>
      sum + Number(medicine.mrp || 0) * Number(medicine.stockQuantity || 0),
    0
  );

  return (
    <div className="medicine-container module-page medicine-page min-vh-100 py-5">
      <div className="container-fluid">
        <ShopFlow active="medicine" onNavigate={onNavigate} />
        {/* Header */}
        <div className="module-header mb-5">
          <h1 className="display-4 fw-bold text-white mb-2">
            <i className="bi bi-capsule"></i> Dawai ki Pehchan Banayein
          </h1>
          <p className="text-white-50 fs-5">Yahan sirf dawa ka naam, batch, expiry aur rate save hota hai</p>
          <span className="module-chip">{medicines.length} master records</span>
        </div>

        <div className="module-insight-grid">
          <div><span>Total Stock</span><strong>{medicines.reduce((sum, item) => sum + Number(item.stockQuantity || 0), 0)} units</strong></div>
          <div className={lowStockCount ? "warning" : ""}><span>Low Stock</span><strong>{lowStockCount} medicines</strong></div>
          <div className={nearExpiryCount ? "danger" : ""}><span>Near Expiry (90 days)</span><strong>{nearExpiryCount} batches</strong></div>
          <div><span>MRP Stock Value</span><strong>₹{stockValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></div>
        </div>

        <div className="module-purpose-note">
          <i className="bi bi-info-circle"></i>
          <div><strong>Is screen ka kaam</strong><span>Nayi dawa ko list mein banayein. Supplier se aaya maal yahan dobara na jodein; uske liye Purchase screen use karein.</span></div>
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
                  {editingId ? "Dawai ki Detail Badlein" : "Nayi Dawai List Mein Jodein"}
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

                  <div className="row g-3 mb-4">
                    {[
                      ["sku", "SKU / Item Code"],
                      ["barcode", "Barcode"],
                      ["hsnCode", "HSN Code"],
                    ].map(([name, label]) => (
                      <div className="col-md-4" key={name}>
                        <label className="form-label text-white fw-600">{label}</label>
                        <input className="form-control" name={name} value={formData[name]} onChange={handleChange} />
                      </div>
                    ))}
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label text-white fw-600">Sale Unit</label>
                      <select className="form-select" name="unit" value={formData.unit} onChange={handleChange}>
                        {["Strip", "Box", "Bottle", "Piece", "Tube", "Vial", "Sachet"].map((unit) => <option key={unit}>{unit}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white fw-600">Units per Pack</label>
                      <input type="number" min="1" className="form-control" name="packSize" value={formData.packSize} onChange={handleChange} required />
                    </div>
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

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label text-white fw-600">Last Purchase Rate</label>
                      <input type="number" min="0" step="0.01" className="form-control" name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white fw-600">Wholesale Rate</label>
                      <input type="number" min="0" step="0.01" className="form-control" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">
                      <i className="bi bi-percent me-2"></i>GST Rate
                    </label>
                    <select
                      className="form-select form-select-lg"
                      name="gstRate"
                      value={formData.gstRate}
                      onChange={handleChange}
                      required
                    >
                      <option value="0">Nil / 0%</option>
                      <option value="5">5% (Current standard medicine rate)</option>
                      <option value="12">12% (Legacy invoice)</option>
                      <option value="18">18%</option>
                    </select>
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

                  <div className="mb-4">
                    <label className="form-label text-white fw-600">Reorder Level</label>
                    <input type="number" min="0" className="form-control form-control-lg" name="minimumStock" value={formData.minimumStock} onChange={handleChange} required />
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
                        : "Create Medicine"}
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
                  <div className="record-card-grid">
                    {medicines.map((med) => (
                      <article className="record-card medicine-record-card" key={med.id}>
                        <div className="record-card-title">
                          <span>Medicine</span>
                          <strong>{med.name}</strong>
                          <small>{med.brand}</small>
                        </div>
                        <div className="record-card-details">
                          <div>
                            <small>Batch</small>
                            <strong>{med.batchNo || "-"}</strong>
                          </div>
                          <div>
                            <small>MRP</small>
                            <strong>₹{Number(med.mrp || 0).toFixed(2)}</strong>
                          </div>
                          <div>
                            <small>GST</small>
                            <strong>{Number(med.gstRate ?? 5)}%</strong>
                          </div>
                          <div>
                            <small>Stock</small>
                            <strong>{med.stockQuantity} units</strong>
                          </div>
                          <div>
                            <small>Expiry</small>
                            <strong className="record-date">{med.expiryDate || "-"}</strong>
                          </div>
                        </div>
                        <div className="record-card-actions">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => handleEdit(med)}
                          >
                            <i className="bi bi-pencil"></i> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => handleDelete(med.id)}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </article>
                    ))}
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
