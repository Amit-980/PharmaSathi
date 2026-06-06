import { useEffect, useMemo, useState } from "react";
import api from "./api";


function Dashboard() {
  const [dashboard, setDashboard] = useState({
    totalMedicines: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalSales: 0,
  });
  const [medicines, setMedicines] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError("");

    try {
      const [dashRes, medRes, purRes, salRes] = await Promise.all([
        api.get("/dashboard"),
        api.get("/medicines"),
        api.get("/purchases"),
        api.get("/sales"),
      ]);

      setDashboard(dashRes.data);
      setMedicines(Array.isArray(medRes.data) ? medRes.data : []);
      setPurchases(Array.isArray(purRes.data) ? purRes.data : []);
      setSales(Array.isArray(salRes.data) ? salRes.data : []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Backend se dashboard data load nahi ho paaya.");
    } finally {
      setLoading(false);
    }
  };

  const metrics = useMemo(() => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);

    const revenue = sales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
      0
    );
    const cost = purchases.reduce(
      (sum, purchase) =>
        sum + Number(purchase.quantity || 0) * Number(purchase.purchasePrice || 0),
      0
    );
    const profit = revenue - cost;
    const totalStock = medicines.reduce(
      (sum, medicine) => sum + Number(medicine.stockQuantity || 0),
      0
    );
    const lowStock = medicines.filter(
      (medicine) =>
        Number(medicine.stockQuantity || 0) > 0 &&
        Number(medicine.stockQuantity || 0) <= 10
    );
    const outOfStock = medicines.filter(
      (medicine) => Number(medicine.stockQuantity || 0) === 0
    );
    const expiringSoon = medicines.filter((medicine) => {
      if (!medicine.expiryDate) return false;
      const expiryDate = new Date(medicine.expiryDate);
      return expiryDate >= today && expiryDate <= nextMonth;
    });

    return {
      revenue,
      cost,
      profit,
      totalStock,
      lowStock,
      outOfStock,
      expiringSoon,
      margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0",
    };
  }, [medicines, purchases, sales]);

  const recentSales = useMemo(
    () =>
      [...sales]
        .sort((a, b) => new Date(b.saleDate || 0) - new Date(a.saleDate || 0))
        .slice(0, 5),
    [sales]
  );

  const topMedicines = useMemo(
    () =>
      [...medicines]
        .sort((a, b) => Number(b.stockQuantity || 0) - Number(a.stockQuantity || 0))
        .slice(0, 5),
    [medicines]
  );

  const medicineNameById = useMemo(() => {
    return medicines.reduce((map, medicine) => {
      map[medicine.id] = medicine.name;
      return map;
    }, {});
  }, [medicines]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) => {
    if (!value) return "No date";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  if (loading) {
    return (
      <main className="dashboard-page dashboard-center">
        <div className="dashboard-spinner" />
        <p>Dashboard load ho raha hai...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Pharmacy overview</p>
          <p className="hero-copy">
            Aaj ka inventory, sales aur purchase status simple cards mein.
          </p>
        </div>
        <div className="hero-actions">
          <button className="refresh-btn" type="button" onClick={loadAllData}>
            Refresh
          </button>
          <span>{formatDate(new Date())}</span>
        </div>
      </section>

      {error && <div className="dashboard-error">{error}</div>}

      <section className="dashboard-kpis" aria-label="Key metrics">
        <MetricCard label="Medicines" value={dashboard.totalMedicines} note="Items registered" tone="blue" icon="M" />
        <MetricCard label="Revenue" value={formatCurrency(metrics.revenue)} note="Total sales value" tone="green" icon="R" />
        <MetricCard label="Profit" value={formatCurrency(metrics.profit)} note={`${metrics.margin}% margin`} tone="violet" icon="P" />
        <MetricCard label="Stock Units" value={metrics.totalStock} note="Available quantity" tone="orange" icon="S" />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel health-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Action needed</p>
              <h2>Inventory Alerts</h2>
            </div>
            <span className="panel-count">
              {metrics.outOfStock.length + metrics.lowStock.length + metrics.expiringSoon.length}
            </span>
          </div>
          <AlertRow title="Out of stock" value={metrics.outOfStock.length} detail="Restock urgently" tone="danger" />
          <AlertRow title="Low stock" value={metrics.lowStock.length} detail="10 units or less" tone="warning" />
          <AlertRow title="Expiring soon" value={metrics.expiringSoon.length} detail="Within next 30 days" tone="info" />
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Business summary</p>
              <h2>Transactions</h2>
            </div>
          </div>
          <div className="transaction-summary">
            <SummaryItem label="Purchases" value={dashboard.totalPurchases} />
            <SummaryItem label="Sales" value={dashboard.totalSales} />
            <SummaryItem label="Purchase Cost" value={formatCurrency(metrics.cost)} />
            <SummaryItem
              label="Average Sale"
              value={sales.length ? formatCurrency(metrics.revenue / sales.length) : formatCurrency(0)}
            />
          </div>
        </div>

        <div className="dashboard-panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2>Recent Sales</h2>
            </div>
            <span className="muted-text">{recentSales.length} entries</span>
          </div>
          {recentSales.length === 0 ? (
            <EmptyState text="Abhi koi sale record nahi hai." />
          ) : (
            <div className="sales-list">
              {recentSales.map((sale) => (
                <div className="sale-row" key={sale.id}>
                  <div className="sale-icon">S</div>
                  <div>
                    <strong>{medicineNameById[sale.medicineId] || "Unknown medicine"}</strong>
                    <span>{formatDate(sale.saleDate)} · {sale.quantity} units</span>
                  </div>
                  <b>{formatCurrency(Number(sale.quantity || 0) * Number(sale.sellingPrice || 0))}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Top Stock Items</h2>
            </div>
          </div>
          {topMedicines.length === 0 ? (
            <EmptyState text="Medicine list empty hai." />
          ) : (
            <div className="stock-list">
              {topMedicines.map((medicine) => (
                <div className="stock-row" key={medicine.id}>
                  <div>
                    <strong>{medicine.name}</strong>
                    <span>{medicine.brand || "No brand"} · Exp {formatDate(medicine.expiryDate)}</span>
                  </div>
                  <b>{medicine.stockQuantity || 0}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, note, tone, icon }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <span className="metric-mark">{icon}</span>
      <p>{label}</p>
      <h2>{value}</h2>
      <small>{note}</small>
    </article>
  );
}

function AlertRow({ title, value, detail, tone }) {
  return (
    <div className={`alert-row alert-${tone}`}>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <b>{value}</b>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="dashboard-empty">{text}</div>;
}

export default Dashboard;
