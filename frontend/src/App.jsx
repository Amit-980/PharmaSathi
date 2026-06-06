import { useState } from "react";
import Dashboard from "./Dashboard";
import Purchase from "./Purchase";
import Sale from "./Sale";
import Medicine from "./Medicine";
import Supplier from "./Supplier";
import Report from "./Report";
import bholenathImage from "./assets/bholenath-login.png";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    if (loginData.username === "admin" && loginData.password === "admin123") {
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
      setLoginData({
        username: "",
        password: "",
      });
      return;
    }

    setLoginError("Invalid username or password");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("dashboard");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "medicine":
        return <Medicine />;
      case "supplier":
        return <Supplier />;
      case "purchase":
        return <Purchase />;
      case "sale":
        return <Sale />;
      case "report":
        return <Report />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", mark: "D", note: "Daily overview" },
    { id: "medicine", label: "Medicines", mark: "M", note: "Stock and expiry" },
    { id: "supplier", label: "Suppliers", mark: "S", note: "Vendor contacts" },
    { id: "purchase", label: "Purchase", mark: "P", note: "Restock entries" },
    { id: "sale", label: "Billing", mark: "B", note: "Fast sale counter" },
    { id: "report", label: "Reports", mark: "R", note: "Audit and accounts" },
  ];
  const activeNavItem =
    navItems.find((item) => item.id === currentPage) || navItems[0];

  if (!isLoggedIn) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="devotional-brand">
            <img src={bholenathImage} alt="Mahadev" />
          </div>
          <h1 className="login-title">PharmaSathi</h1>

          {loginError && (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label" htmlFor="username">
                Username
              </label>
              <input
                className="form-control form-control-lg"
                id="username"
                name="username"
                type="text"
                value={loginData.username}
                onChange={handleLoginChange}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                className="form-control form-control-lg"
                id="password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginChange}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="login-hint">Use admin / admin123</div>

            <button className="btn btn-primary btn-lg w-100 mt-3" type="submit">
              Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">PS</span>
          <div>
            <strong>PharmaSathi</strong>
            <small>Retail pharmacy suite</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-section-title">Workspace</p>
          {navItems.map((item) => (
            <a
              className={`sidebar-link ${
                currentPage === item.id ? "active" : ""
              }`}
              href="#"
              key={item.id}
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(item.id);
              }}
            >
              <span>{item.mark}</span>
              <div>
                <strong>{item.label}</strong>
                <small>{item.note}</small>
              </div>
            </a>
          ))}
        </nav>

        <div className="sidebar-insight">
          <small>Shopkeeper focus</small>
          <strong>Stock, expiry, purchase and billing in one flow.</strong>
        </div>

        <div className="sidebar-footer">
          <div>
            <small>Signed in as</small>
            <strong>Admin</strong>
          </div>
          <button
            className="btn btn-light btn-sm nav-logout"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="app-content">
        <header className="app-topbar">
          <div>
            <p>Current module</p>
            <h2>{activeNavItem.label}</h2>
          </div>
          <span>{activeNavItem.note}</span>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
