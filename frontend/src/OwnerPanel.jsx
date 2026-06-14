import { useState } from "react";
import api from "./api";

export default function OwnerPanel() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [adminToken, setAdminToken] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    shopName: "", ownerName: "", phone: "", email: "", address: "",
    gstin: "", drugLicense: "", plan: "Business", username: "", password: "",
  });

  const headers = { Authorization: `Bearer ${adminToken}` };

  const login = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const loginResponse = await api.post("/admin/login", credentials);
      const token = loginResponse.data.token;
      setAdminToken(token);
      const response = await api.get("/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Platform admin access nahi mil paaya");
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    const response = await api.get("/admin/customers", { headers });
    setCustomers(response.data);
  };

  const updateCustomer = async (id, payload) => {
    try {
      await api.patch(`/admin/customers/${id}`, payload, { headers });
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Customer update nahi hua");
    }
  };

  const renew = async (id, days) => {
    try {
      await api.post(`/admin/customers/${id}/renew?days=${days}`, null, { headers });
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Renewal nahi hua");
    }
  };

  const downloadBackup = async () => {
    try {
      const response = await api.get("/admin/backup", { headers });
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pharmasathi-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Backup download nahi hua");
    }
  };

  const createCustomer = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await api.post("/admin/customers", newCustomer, { headers });
      setNewCustomer({
        shopName: "", ownerName: "", phone: "", email: "", address: "",
        gstin: "", drugLicense: "", plan: "Business", username: "", password: "",
      });
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Customer account create nahi hua");
    }
  };

  return (
    <main className="owner-page">
      <header className="owner-header">
        <div>
          <p>PharmaSathi Platform Administration</p>
          <h1>Customers and subscriptions</h1>
        </div>
        <a href={window.location.pathname}>Back to app</a>
      </header>

      {!adminToken ? <form className="owner-access" onSubmit={login}>
        <label>
          <span>Admin Username</span>
          <input
            value={credentials.username}
            onChange={(event) => setCredentials((value) => ({ ...value, username: event.target.value }))}
            autoComplete="username"
            required
          />
        </label>
        <label>
          <span>Admin Password</span>
          <input
            type="password"
            value={credentials.password}
            onChange={(event) => setCredentials((value) => ({ ...value, password: event.target.value }))}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Admin Login"}
        </button>
      </form> : <section className="owner-access">
        <strong>Platform admin session active</strong>
        <button type="button" onClick={downloadBackup}>
          Download Backup
        </button>
        <button type="button" onClick={async () => {
          await api.post("/admin/logout", null, { headers });
          setAdminToken("");
          setCustomers([]);
        }}>Logout Admin</button>
      </section>}

      {error && <div className="owner-error">{error}</div>}

      {adminToken && (
        <form className="owner-customer-card owner-create-form" onSubmit={createCustomer}>
          <div className="owner-customer-title">
            <div><small>Platform admin only</small><h2>Create pharmacy customer</h2></div>
          </div>
          <div className="owner-customer-meta">
            {[
              ["shopName", "Pharmacy Name", "text"],
              ["ownerName", "Owner Name", "text"],
              ["phone", "Phone", "tel"],
              ["email", "Email", "email"],
              ["username", "Login Username", "text"],
              ["password", "Temporary Password", "password"],
            ].map(([name, label, type]) => (
              <label key={name}><span>{label}</span><input type={type} value={newCustomer[name]} onChange={(event) => setNewCustomer((value) => ({ ...value, [name]: event.target.value }))} required={name !== "email"} /></label>
            ))}
            <label><span>Plan</span><select value={newCustomer.plan} onChange={(event) => setNewCustomer((value) => ({ ...value, plan: event.target.value }))}><option>Starter</option><option>Business</option><option>Pro</option></select></label>
          </div>
          <div className="owner-customer-actions"><button type="submit">Create Customer Account</button></div>
        </form>
      )}

      <section className="owner-customer-grid">
        {customers.map((customer) => (
          <article className="owner-customer-card" key={customer.id}>
            <div className="owner-customer-title">
              <div>
                <small>Customer #{customer.id}</small>
                <h2>{customer.shopName}</h2>
                <p>{customer.ownerName} · {customer.phone}</p>
              </div>
              <span className={customer.enabled ? "active" : "disabled"}>
                {customer.enabled ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="owner-customer-meta">
              <div><span>Plan</span><strong>{customer.plan}</strong></div>
              <div><span>Valid till</span><strong>{customer.subscriptionEndDate || "Not set"}</strong></div>
              <div><span>Email</span><strong>{customer.email || "Not provided"}</strong></div>
            </div>

            <div className="owner-customer-actions">
              <select
                value={customer.plan}
                onChange={(event) => updateCustomer(customer.id, { plan: event.target.value })}
              >
                <option>Starter</option>
                <option>Business</option>
                <option>Pro</option>
              </select>
              <button type="button" onClick={() => renew(customer.id, 30)}>+30 Days</button>
              <button type="button" onClick={() => renew(customer.id, 365)}>+1 Year</button>
              <button
                className={customer.enabled ? "danger" : "success"}
                type="button"
                onClick={() => updateCustomer(customer.id, { enabled: !customer.enabled })}
              >
                {customer.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
