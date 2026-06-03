import { useEffect, useState } from "react";
import axios from "axios";

function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/suppliers");
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error loading suppliers:", error);
      setErrorMessage("Failed to load suppliers");
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
      if (editingId) {
        await axios.put(
          `http://localhost:8080/api/suppliers/${editingId}`,
          formData
        );
        setSuccessMessage("Supplier updated successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:8080/api/suppliers", formData);
        setSuccessMessage("Supplier added successfully!");
      }

      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
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
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await axios.delete(`http://localhost:8080/api/suppliers/${id}`);
        setSuccessMessage("Supplier deleted successfully!");
        loadSuppliers();
      } catch (error) {
        setErrorMessage("Error deleting supplier");
      }
    }
  };

  return (
    <div className="supplier-container module-page supplier-page py-5">
      <div className="container-lg">
        <div className="module-header mb-5">
          <h1 className="display-5 fw-bold text-white mb-2">Manage Suppliers</h1>
          <p className="text-white-50">Add, edit, and manage your medicine suppliers</p>
          <span className="module-chip">{suppliers.length} suppliers</span>
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

        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 sticky-top" style={{ top: "20px" }}>
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

          <div className="col-lg-8">
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
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr className="table-light">
                          <th className="fw-bold text-dark">Supplier Name</th>
                          <th className="fw-bold text-dark">Contact</th>
                          <th className="fw-bold text-dark">Email</th>
                          <th className="fw-bold text-dark">Address</th>
                          <th className="fw-bold text-dark">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliers.map((supplier) => (
                          <tr key={supplier.id} className="align-middle">
                            <td>
                              <div className="fw-bold text-dark">{supplier.name}</div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-telephone me-2 text-info"></i>
                                {supplier.phone}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-envelope me-2 text-warning"></i>
                                {supplier.email}
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">{supplier.address}</small>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary fw-bold"
                                  onClick={() => handleEdit(supplier)}
                                  title="Edit supplier"
                                >
                                  <i className="bi bi-pencil-square"></i> Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger fw-bold"
                                  onClick={() => handleDelete(supplier.id)}
                                  title="Delete supplier"
                                >
                                  <i className="bi bi-trash"></i> Delete
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

export default Supplier;
