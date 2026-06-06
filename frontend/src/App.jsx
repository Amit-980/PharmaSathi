import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Purchase from "./Purchase";
import Sale from "./Sale";
import Medicine from "./Medicine";
import Supplier from "./Supplier";
import Report from "./Report";
import Plans from "./Plans";
import bholenathImage from "./assets/bholenath-login.png";
import { isDemoMode } from "./api";
import api from "./api";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(isDemoMode);
  const [setupLoading, setSetupLoading] = useState(!isDemoMode);
  const [isRegistered, setIsRegistered] = useState(isDemoMode);
  const [shopInfo, setShopInfo] = useState({ shopName: "PharmaSathi", ownerName: "Admin" });
  const [registrationData, setRegistrationData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
  });
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (isDemoMode) return;

    api.get("/setup/status")
      .then((response) => {
        setIsRegistered(Boolean(response.data.registered));
        if (response.data.registered) {
          setShopInfo({
            shopName: response.data.shopName,
            ownerName: response.data.ownerName,
          });
        }
      })
      .catch(() => setLoginError("Application start nahi ho paayi. Please restart PharmaSathi."))
      .finally(() => setSetupLoading(false));
  }, []);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (isDemoMode) {
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
      return;
    }

    try {
      const response = await api.post("/setup/login", loginData);
      setShopInfo({
        shopName: response.data.shopName,
        ownerName: response.data.ownerName,
      });
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
      setLoginData({ username: "", password: "" });
    } catch (error) {
      setLoginError(error.response?.data?.message || "Invalid username or password");
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await api.post("/setup/register", registrationData);
      setShopInfo({
        shopName: response.data.shopName,
        ownerName: response.data.ownerName,
      });
      setLoginData({
        username: registrationData.username,
        password: "",
      });
      setIsRegistered(true);
    } catch (error) {
      setLoginError(error.response?.data?.message || "Registration complete nahi ho paaya");
    }
  };

  const enterDemo = () => {
    if (!isDemoMode) {
      window.location.href = `${window.location.pathname}?demo=1`;
      return;
    }
    setIsLoggedIn(true);
    setCurrentPage("dashboard");
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
      case "plans":
        return <Plans />;
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
    { id: "plans", label: "Subscription", mark: "₹", note: "Plans and renewal" },
  ];
  const activeNavItem =
    navItems.find((item) => item.id === currentPage) || navItems[0];

  if (setupLoading) {
    return (
      <main className="login-page">
        <section className="login-card setup-loading-card">
          <div className="dashboard-spinner"></div>
          <strong>PharmaSathi start ho raha hai...</strong>
        </section>
      </main>
    );
  }

  if (!isRegistered) {
    return (
      <main className="login-page">
        <section className="login-card registration-card">
          <div className="devotional-brand">
            <img src={bholenathImage} alt="Mahadev" />
          </div>
          <h1 className="login-title">Register Your Pharmacy</h1>
          <p className="registration-copy">First-time setup · Details isi computer par secure rahengi</p>

          {loginError && <div className="alert alert-danger py-2">{loginError}</div>}

          <form className="registration-grid" onSubmit={handleRegistration}>
            {[
              ["shopName", "Pharmacy Name", "text"],
              ["ownerName", "Owner Name", "text"],
              ["phone", "Mobile Number", "tel"],
              ["email", "Email (Optional)", "email"],
              ["username", "Login Username", "text"],
              ["password", "Login Password", "password"],
            ].map(([name, label, type]) => (
              <label key={name}>
                <span>{label}</span>
                <input
                  className="form-control"
                  name={name}
                  type={type}
                  value={registrationData[name]}
                  onChange={(e) =>
                    setRegistrationData((previous) => ({
                      ...previous,
                      [e.target.name]: e.target.value,
                    }))
                  }
                  required={name !== "email"}
                />
              </label>
            ))}
            <button className="btn btn-primary" type="submit">Register & Continue</button>
          </form>
        </section>
      </main>
    );
  }

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
            <button className="demo-login-btn" type="button" onClick={enterDemo}>
              <i className="bi bi-play-circle"></i>
              Open Live Demo
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
            <strong>{shopInfo.shopName}</strong>
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
            <strong>{shopInfo.ownerName}</strong>
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
        {isDemoMode && (
          <div className="demo-mode-banner">
            <strong>Live Demo</strong>
            <span>Sample pharmacy data · Changes stay only in this browser</span>
          </div>
        )}
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
