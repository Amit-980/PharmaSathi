import { useState } from "react";
import api from "./api";

export default function OwnerPanel({ onBack }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [adminToken, setAdminToken] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerErrors, setCustomerErrors] = useState({});
  const [customerSuccess, setCustomerSuccess] = useState("");
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
    setCustomerSuccess("");
    const validationErrors = validateCustomer(newCustomer);
    if (Object.keys(validationErrors).length) {
      setCustomerErrors(validationErrors);
      return;
    }
    setCustomerErrors({});
    try {
      await api.post("/admin/customers", newCustomer, { headers });
      setNewCustomer({
        shopName: "", ownerName: "", phone: "", email: "", address: "",
        gstin: "", drugLicense: "", plan: "Business", username: "", password: "",
      });
      setCustomerSuccess("Pharmacy account created. Customer can now use the Pharmacy Login.");
      await loadCustomers();
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Customer account create nahi hua";
      if (message.toLowerCase().includes("username")) {
        setCustomerErrors({ username: "This username is already in use. Choose another username." });
      } else {
        setError(message);
      }
    }
  };

  const updateNewCustomer = (name, value) => {
    setNewCustomer((current) => ({ ...current, [name]: value }));
    setCustomerErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  return (
    <main className="owner-page">
      <header className="owner-header">
        <div>
          <p>PharmaSathi Platform Administration</p>
          <h1>Customers and subscriptions</h1>
        </div>
        <button className="owner-back-button" type="button" onClick={onBack}>
          Pharmacy Login
        </button>
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
          <p className="owner-form-help">Fill the required details. Any problem will appear directly below the related field.</p>
          <div className="owner-customer-meta">
            {[
              ["shopName", "Pharmacy Name", "text", "Example: Global Pharma"],
              ["ownerName", "Owner Name", "text", "Full name of pharmacy owner"],
              ["phone", "Phone", "tel", "Exactly 10 digits"],
              ["email", "Email (Optional)", "email", "Example: owner@pharmacy.com"],
              ["username", "Login Username", "text", "Minimum 4 letters or numbers"],
              ["password", "Temporary Password", "password", "Minimum 8 characters"],
            ].map(([name, label, type, placeholder]) => (
              <label className={customerErrors[name] ? "field-invalid" : ""} key={name}>
                <span>{label}</span>
                <input
                  type={type}
                  value={newCustomer[name]}
                  onChange={(event) => updateNewCustomer(name, event.target.value)}
                  placeholder={placeholder}
                  inputMode={name === "phone" ? "numeric" : undefined}
                  maxLength={name === "phone" ? 10 : undefined}
                  aria-invalid={Boolean(customerErrors[name])}
                />
                {customerErrors[name] && <small className="field-error">{customerErrors[name]}</small>}
              </label>
            ))}
            <label><span>Plan</span><select value={newCustomer.plan} onChange={(event) => updateNewCustomer("plan", event.target.value)}><option>Starter</option><option>Business</option><option>Pro</option></select></label>
          </div>
          {customerSuccess && <div className="owner-form-success">{customerSuccess}</div>}
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

function validateCustomer(customer) {
  const errors = {};
  if (!customer.shopName.trim()) errors.shopName = "Enter the pharmacy name.";
  if (!customer.ownerName.trim()) errors.ownerName = "Enter the pharmacy owner's name.";
  if (!/^\d{10}$/.test(customer.phone.trim())) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }
  if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
    errors.email = "Enter a valid email address, or leave it blank.";
  }
  if (customer.username.trim().length < 4) {
    errors.username = "Username must contain at least 4 characters.";
  } else if (!/^[a-zA-Z0-9._-]+$/.test(customer.username.trim())) {
    errors.username = "Use only letters, numbers, dot, underscore or hyphen.";
  }
  if (customer.password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }
  return errors;
}
