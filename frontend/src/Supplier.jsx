import { useEffect, useState } from "react";
import api from "./api";
import ShopFlow from "./ShopFlow";

function Supplier({ onNavigate }) {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    drugLicense: "",
    creditDays: "0",
    openingBalance: "0",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorMessage("Failed to load suppliers");
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
      if (editingId) {
        await api.put(`/suppliers/${editingId}`, formData);
        setSuccessMessage("Supplier updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/suppliers", formData);
        setSuccessMessage("Supplier added successfully!");
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        gstin: "", drugLicense: "", creditDays: "0", openingBalance: "0",
      });
      loadSuppliers();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Error saving supplier"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      gstin: supplier.gstin || "",
      drugLicense: supplier.drugLicense || "",
      creditDays: supplier.creditDays ?? 0,
      openingBalance: supplier.openingBalance ?? 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      gstin: "", drugLicense: "", creditDays: "0", openingBalance: "0",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await api.delete(`/suppliers/${id}`);
        setSuccessMessage("Supplier deleted successfully!");
        loadSuppliers();
      } catch {
        setErrorMessage("Error deleting supplier");
      }
    }
  };

  const completeContacts = suppliers.filter(
    (supplier) => supplier.phone && supplier.email && supplier.address
  ).length;

  return (
    <div className="supplier-container module-page supplier-page py-5">
      <div className="container-lg">
        <div className="module-open-guide">
          <i className="bi bi-truck"></i>
          <div><small>SUPPLIERS</small><strong>Yahan un distributors ko jodein jinse aap dawa kharidte hain</strong><span>Supplier customer nahi hota. Yeh woh company ya wholesaler hai jo aapki pharmacy ko maal deta hai, jaise ABC Pharma Distributor.</span></div>
        </div>
        <ShopFlow active="supplier" onNavigate={onNavigate} />
        <div className="module-header mb-5">
          <h1 className="display-5 fw-bold text-white mb-2">Suppliers</h1>
          <p className="text-white-50">Manage distributors and wholesalers who supply medicines to your pharmacy</p>
          <span className="module-chip">{suppliers.length} suppliers</span>
        </div>

        <div className="module-insight-grid module-insight-grid-three">
          <div><span>Active Suppliers</span><strong>{suppliers.length}</strong></div>
          <div><span>Complete Profiles</span><strong>{completeContacts}</strong></div>
          <div className={completeContacts < suppliers.length ? "warning" : ""}>
            <span>Details Pending</span><strong>{suppliers.length - completeContacts}</strong>
          </div>
        </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
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
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {errorMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setErrorMessage("")}
            ></button>
          </div>
        )}

        <div className="row g-4 supplier-workspace">
          <div className="col-xl-4 col-lg-5">
            <div className="card shadow-sm border-0 supplier-form-card">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  {editingId ? (
                    <>
                      <i className="bi bi-pencil-square text-primary me-2"></i>
                      Edit Supplier
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle text-success me-2"></i>
                      Add New Supplier
                    </>
                  )}
                </h5>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-600 text-dark">Supplier Name</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter supplier name"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-600 text-dark">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control form-control-lg"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-600 text-dark">Email Address</label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="supplier@example.com"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-600 text-dark">Address</label>
                    <textarea
                      className="form-control form-control-lg"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Full address (city, state, etc.)"
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <label className="form-label fw-600">GSTIN</label>
                      <input className="form-control" name="gstin" value={formData.gstin} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-600">Drug Licence</label>
                      <input className="form-control" name="drugLicense" value={formData.drugLicense} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-600">Credit Days</label>
                      <input type="number" min="0" className="form-control" name="creditDays" value={formData.creditDays} onChange={handleChange} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-600">Opening Balance</label>
                      <input type="number" step="0.01" className="form-control" name="openingBalance" value={formData.openingBalance} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="d-grid gap-3">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg fw-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Saving...
                        </>
                      ) : editingId ? (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Update Supplier
                        </>
                      ) : (
                        <>
                          <i className="bi bi-plus-circle me-2"></i>
                          Add Supplier
                        </>
                      )}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg fw-bold"
                        onClick={handleCancel}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="col-xl-8 col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">
                  <i className="bi bi-building text-info me-2"></i>
                  Suppliers List ({suppliers.length})
                </h5>

                {suppliers.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                    <p className="text-muted mt-3 fs-5">No suppliers added yet</p>
                    <p className="text-muted small">Add your first supplier using the form on the left</p>
                  </div>
                ) : (
                  <div className="supplier-card-grid">
                    {suppliers.map((supplier) => (
                      <article className="supplier-list-card" key={supplier.id}>
                        <div className="supplier-list-title">
                          <span>Supplier</span>
                          <strong>{supplier.name}</strong>
                        </div>
                        <div className="supplier-list-details">
                          <div>
                            <small>Phone</small>
                            <strong>{supplier.phone}</strong>
                          </div>
                          <div>
                            <small>Email</small>
                            <strong className="supplier-email-text">{supplier.email}</strong>
                          </div>
                          <div className="supplier-address-detail">
                            <small>Address</small>
                            <strong>{supplier.address || "No address"}</strong>
                          </div>
                          <div><small>GSTIN</small><strong>{supplier.gstin || "Unregistered"}</strong></div>
                          <div><small>Credit Terms</small><strong>{supplier.creditDays || 0} days</strong></div>
                        </div>
                        <div className="supplier-actions">
                          <button
                            type="button"
                            className="btn btn-primary fw-bold"
                            onClick={() => handleEdit(supplier)}
                            title="Edit supplier"
                          >
                            <i className="bi bi-pencil-square"></i> Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger fw-bold"
                            onClick={() => handleDelete(supplier.id)}
                            title="Delete supplier"
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

export default Supplier;
