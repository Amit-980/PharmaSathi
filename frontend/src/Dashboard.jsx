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
    // The loader is intentionally invoked once when the dashboard mounts.
    // eslint-disable-next-line react-hooks/immutability
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
    const todayKey = today.toISOString().slice(0, 10);
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
    const inventoryValue = medicines.reduce(
      (sum, medicine) =>
        sum +
        Number(medicine.stockQuantity || 0) *
          Number(medicine.purchasePrice || medicine.wholesalePrice || medicine.mrp || 0),
      0
    );
    const todaySales = sales.filter((sale) => sale.saleDate === todayKey);
    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
      0
    );
    const creditSales = sales.filter((sale) => sale.paymentStatus === "CREDIT");
    const creditOutstanding = creditSales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
      0
    );
    const lowStock = medicines.filter(
      (medicine) =>
        Number(medicine.stockQuantity || 0) > 0 &&
        Number(medicine.stockQuantity || 0) <= Number(medicine.minimumStock || 10)
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
      inventoryValue,
      todayRevenue,
      todayBills: todaySales.length,
      creditOutstanding,
      lowStock,
      outOfStock,
      expiringSoon,
      margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0",
    };
  }, [medicines, purchases, sales]);

  const salesTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const value = sales
        .filter((sale) => sale.saleDate === key)
        .reduce(
          (sum, sale) =>
            sum + Number(sale.quantity || 0) * Number(sale.sellingPrice || 0),
          0
        );
      return {
        key,
        label: new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date),
        value,
      };
    });
    const max = Math.max(...days.map((day) => day.value), 1);
    return days.map((day) => ({ ...day, height: Math.max(6, (day.value / max) * 100) }));
  }, [sales]);

  const paymentMix = useMemo(() => {
    const modes = sales.reduce((summary, sale) => {
      const mode = sale.paymentMode || "CASH";
      summary[mode] = (summary[mode] || 0) + 1;
      return summary;
    }, {});
    return Object.entries(modes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [sales]);

  const stockWatchlist = useMemo(
    () =>
      [...medicines]
        .sort((a, b) => {
          const aRatio = Number(a.stockQuantity || 0) / Math.max(Number(a.minimumStock || 10), 1);
          const bRatio = Number(b.stockQuantity || 0) / Math.max(Number(b.minimumStock || 10), 1);
          return aRatio - bRatio;
        })
        .slice(0, 4),
    [medicines]
  );

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
          <span className="hero-status"><i /> Live business overview</span>
          <p className="hero-copy">
            Sales, inventory health aur purchase activity ka clear operational view.
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
        <MetricCard label="Today's Sales" value={formatCurrency(metrics.todayRevenue)} note={`${metrics.todayBills} bills today`} tone="blue" icon="₹" />
        <MetricCard label="Total Revenue" value={formatCurrency(metrics.revenue)} note={`${dashboard.totalSales} completed bills`} tone="green" icon="R" />
        <MetricCard label="Gross Position" value={formatCurrency(metrics.profit)} note={`${metrics.margin}% estimated margin`} tone="violet" icon="P" />
        <MetricCard label="Inventory Value" value={formatCurrency(metrics.inventoryValue)} note={`${metrics.totalStock} units available`} tone="orange" icon="I" />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel trend-panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Last seven days</p>
              <h2>Sales Momentum</h2>
            </div>
            <strong className="trend-total">{formatCurrency(salesTrend.reduce((sum, day) => sum + day.value, 0))}</strong>
          </div>
          <div className="sales-chart" aria-label="Seven day sales chart">
            {salesTrend.map((day) => (
              <div className="chart-column" key={day.key}>
                <span>{day.value ? formatCurrency(day.value) : "₹0"}</span>
                <div><i style={{ height: `${day.height}%` }} /></div>
                <b>{day.label}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel pulse-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Cash flow pulse</p>
              <h2>Collection Health</h2>
            </div>
          </div>
          <div className="collection-value">
            <span>Credit outstanding</span>
            <strong>{formatCurrency(metrics.creditOutstanding)}</strong>
          </div>
          <div className="payment-mix">
            {paymentMix.length ? paymentMix.map(([mode, count]) => (
              <div key={mode}>
                <span>{mode}</span>
                <b>{count} bills</b>
              </div>
            )) : <EmptyState text="Payment data available nahi hai." />}
          </div>
        </div>

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
          <AlertRow title="Low stock" value={metrics.lowStock.length} detail="Below reorder level" tone="warning" />
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

        <div className="dashboard-panel stock-watch-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Reorder priority</p>
              <h2>Stock Watchlist</h2>
            </div>
          </div>
          <div className="watch-list">
            {stockWatchlist.map((medicine) => {
              const stock = Number(medicine.stockQuantity || 0);
              const target = Number(medicine.minimumStock || 10);
              const level = Math.min(100, (stock / Math.max(target, 1)) * 100);
              return (
                <div className="watch-item" key={medicine.id}>
                  <div><strong>{medicine.name}</strong><span>{medicine.batchNo || "No batch"} · target {target}</span></div>
                  <b>{stock}</b>
                  <div className="stock-meter"><i style={{ width: `${level}%` }} /></div>
                </div>
              );
            })}
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
