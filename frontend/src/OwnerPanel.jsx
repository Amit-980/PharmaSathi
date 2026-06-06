import { useState } from "react";
import api from "./api";

export default function OwnerPanel() {
  const [ownerKey, setOwnerKey] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { "X-Owner-Key": ownerKey };

  const loadCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/owner/customers", { headers });
      setCustomers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Owner access nahi mil paaya");
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id, payload) => {
    try {
      await api.patch(`/owner/customers/${id}`, payload, { headers });
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Customer update nahi hua");
    }
  };

  const renew = async (id, days) => {
    try {
      await api.post(`/owner/customers/${id}/renew?days=${days}`, null, { headers });
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Renewal nahi hua");
    }
  };

  const downloadBackup = async () => {
    try {
      const response = await api.get("/owner/backup", { headers });
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

  return (
    <main className="owner-page">
      <header className="owner-header">
        <div>
          <p>PharmaSathi Owner Console</p>
          <h1>Customer subscriptions</h1>
        </div>
        <a href={window.location.pathname}>Back to app</a>
      </header>

      <section className="owner-access">
        <label>
          <span>Owner Key</span>
          <input
            type="password"
            value={ownerKey}
            onChange={(event) => setOwnerKey(event.target.value)}
            placeholder="Enter local owner key"
          />
        </label>
        <button type="button" onClick={loadCustomers} disabled={!ownerKey || loading}>
          {loading ? "Loading..." : "Open Console"}
        </button>
        <button type="button" onClick={downloadBackup} disabled={!ownerKey}>
          Download Backup
        </button>
      </section>

      {error && <div className="owner-error">{error}</div>}

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
