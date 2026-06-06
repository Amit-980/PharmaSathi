import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import Purchase from "./Purchase";
import Sale from "./Sale";
import Medicine from "./Medicine";
import Supplier from "./Supplier";
import Report from "./Report";
import Plans from "./Plans";
import OwnerPanel from "./OwnerPanel";
import bholenathImage from "./assets/bholenath-login.png";
import { isDemoMode } from "./api";
import api from "./api";

const demoAccountKey = "pharmasathi-demo-account";
const trialDays = 30;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString();
};

const readDemoAccount = () => {
  try {
    const account = JSON.parse(localStorage.getItem(demoAccountKey));
    if (!account) return null;
    if (!account.trialStartedAt || !account.trialEndsAt) {
      const trialStartedAt = new Date().toISOString();
      const upgradedAccount = {
        ...account,
        trialStartedAt,
        trialEndsAt: addDays(trialStartedAt, trialDays),
      };
      localStorage.setItem(demoAccountKey, JSON.stringify(upgradedAccount));
      return upgradedAccount;
    }
    return account;
  } catch {
    return null;
  }
};

function App() {
  const ownerMode = new URLSearchParams(window.location.search).get("owner") === "1";
  const [demoAccount, setDemoAccount] = useState(() =>
    isDemoMode ? readDemoAccount() : null
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [setupLoading, setSetupLoading] = useState(!isDemoMode && !ownerMode);
  const [isRegistered, setIsRegistered] = useState(
    isDemoMode ? Boolean(demoAccount) : false
  );
  const [registrationStep, setRegistrationStep] = useState(1);
  const [shopInfo, setShopInfo] = useState(() => ({
    shopName: demoAccount?.shopName || "PharmaSathi",
    ownerName: demoAccount?.ownerName || "Admin",
    plan: demoAccount?.plan || "Business",
  }));
  const [registrationData, setRegistrationData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    drugLicense: "",
    plan: "Business",
    username: "",
    password: "",
  });
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [sessionStartedAt] = useState(() => Date.now());
  const trialDaysLeft = demoAccount?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(demoAccount.trialEndsAt).getTime() - sessionStartedAt) / 86400000
        )
      )
    : trialDays;

  useEffect(() => {
    if (isDemoMode || ownerMode) return;

    api.get("/setup/status")
      .then((response) => {
        setIsRegistered(Boolean(response.data.registered));
        if (response.data.registered) {
          setShopInfo({
            shopName: response.data.shopName,
            ownerName: response.data.ownerName,
            plan: response.data.plan || "Business",
          });
        }
      })
      .catch(() => setLoginError("Application start nahi ho paayi. Please restart PharmaSathi."))
      .finally(() => setSetupLoading(false));
  }, [ownerMode]);

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
      if (demoAccount?.trialEndsAt && new Date(demoAccount.trialEndsAt) < new Date()) {
        setLoginError("30-day trial complete ho gaya hai. Subscription activate karne ke liye PharmaSathi owner se contact karein.");
        return;
      }
      if (
        loginData.username !== demoAccount?.username ||
        loginData.password !== demoAccount?.password
      ) {
        setLoginError("Invalid username or password");
        return;
      }
      setIsLoggedIn(true);
      setCurrentPage("dashboard");
      setLoginData({ username: "", password: "" });
      return;
    }

    try {
      const response = await api.post("/setup/login", loginData);
      setShopInfo({
        shopName: response.data.shopName,
        ownerName: response.data.ownerName,
        plan: response.data.plan || "Business",
      });
      sessionStorage.setItem("pharmasathi-auth-token", response.data.token);
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

    if (isDemoMode) {
      const trialStartedAt = new Date().toISOString();
      const account = {
        ...registrationData,
        trialStartedAt,
        trialEndsAt: addDays(trialStartedAt, trialDays),
      };
      localStorage.setItem(demoAccountKey, JSON.stringify(account));
      setDemoAccount(account);
      setShopInfo({
        shopName: account.shopName,
        ownerName: account.ownerName,
        plan: account.plan,
      });
      setLoginData({ username: account.username, password: "" });
      setIsRegistered(true);
      return;
    }

    try {
      const response = await api.post("/setup/register", registrationData);
      setShopInfo({
        shopName: response.data.shopName,
        ownerName: response.data.ownerName,
        plan: response.data.plan || registrationData.plan,
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

  const handleLogout = () => {
    sessionStorage.removeItem("pharmasathi-auth-token");
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

  if (ownerMode) {
    return <OwnerPanel />;
  }

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
    const registrationSteps = [
      { number: 1, label: "Pharmacy" },
      { number: 2, label: "Plan" },
      { number: 3, label: "Login" },
    ];

    return (
      <main className="registration-page">
        <section className="registration-shell">
          <header className="registration-header">
            <div className="registration-brand">
              <div className="devotional-brand">
                <img src={bholenathImage} alt="Mahadev" />
              </div>
              <div>
                <p>PharmaSathi Setup</p>
                <h1>Register Your Pharmacy</h1>
                <span>One-time setup for this installation</span>
              </div>
            </div>
            <div className="registration-progress">
              {registrationSteps.map((step) => (
                <div
                  className={registrationStep >= step.number ? "active" : ""}
                  key={step.number}
                >
                  <b>{step.number}</b>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </header>

          {loginError && <div className="alert alert-danger py-2">{loginError}</div>}

          <form className="registration-form" onSubmit={handleRegistration}>
            {registrationStep === 1 && (
              <section className="registration-step">
                <div className="registration-step-heading">
                  <p>Business details</p>
                  <h2>Tell us about the pharmacy</h2>
                </div>
                <div className="registration-grid">
                  {[
                    ["shopName", "Pharmacy Name", "text", true],
                    ["ownerName", "Owner Name", "text", true],
                    ["phone", "Mobile Number", "tel", true],
                    ["email", "Email Address", "email", false],
                    ["gstin", "GSTIN (Optional)", "text", false],
                    ["drugLicense", "Drug Licence Number", "text", false],
                  ].map(([name, label, type, required]) => (
                    <RegistrationInput
                      key={name}
                      name={name}
                      label={label}
                      type={type}
                      required={required}
                      value={registrationData[name]}
                      onChange={setRegistrationData}
                    />
                  ))}
                  <label className="registration-full-field">
                    <span>Pharmacy Address</span>
                    <textarea
                      name="address"
                      value={registrationData.address}
                      onChange={(e) =>
                        setRegistrationData((previous) => ({
                          ...previous,
                          address: e.target.value,
                        }))
                      }
                      rows="2"
                      required
                    />
                  </label>
                </div>
              </section>
            )}

            {registrationStep === 2 && (
              <section className="registration-step">
                <div className="registration-step-heading">
                  <p>Subscription</p>
                  <h2>Choose the customer plan</h2>
                </div>
                <div className="registration-plan-grid">
                  {[
                    ["Starter", "₹499", "Billing, stock and basic reports"],
                    ["Business", "₹999", "GST, audit reports and backup"],
                    ["Pro", "₹1,499", "Multi-user access and priority support"],
                  ].map(([name, price, description]) => (
                    <label
                      className={registrationData.plan === name ? "selected" : ""}
                      key={name}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={name}
                        checked={registrationData.plan === name}
                        onChange={(e) =>
                          setRegistrationData((previous) => ({
                            ...previous,
                            plan: e.target.value,
                          }))
                        }
                      />
                      <span>{name}</span>
                      <strong>{price}<small>/month</small></strong>
                      <p>{description}</p>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {registrationStep === 3 && (
              <section className="registration-step">
                <div className="registration-step-heading">
                  <p>Secure access</p>
                  <h2>Create the owner login</h2>
                </div>
                <div className="registration-grid">
                  <RegistrationInput
                    name="username"
                    label="Login Username"
                    type="text"
                    required
                    value={registrationData.username}
                    onChange={setRegistrationData}
                  />
                  <RegistrationInput
                    name="password"
                    label="Login Password"
                    type="password"
                    required
                    value={registrationData.password}
                    onChange={setRegistrationData}
                  />
                </div>
                <div className="registration-summary">
                  <div><span>Pharmacy</span><strong>{registrationData.shopName}</strong></div>
                  <div><span>Owner</span><strong>{registrationData.ownerName}</strong></div>
                  <div><span>Plan</span><strong>{registrationData.plan}</strong></div>
                  <div><span>Mobile</span><strong>{registrationData.phone}</strong></div>
                </div>
              </section>
            )}

            <footer className="registration-actions">
              {registrationStep > 1 ? (
                <button type="button" className="registration-back" onClick={() => setRegistrationStep((step) => step - 1)}>
                  <i className="bi bi-arrow-left"></i> Back
                </button>
              ) : <span />}

              {registrationStep < 3 ? (
                <button
                  type="button"
                  className="registration-next"
                  onClick={() => setRegistrationStep((step) => step + 1)}
                  disabled={
                    registrationStep === 1 &&
                    (!registrationData.shopName ||
                      !registrationData.ownerName ||
                      !/^\d{10}$/.test(registrationData.phone) ||
                      !registrationData.address)
                  }
                >
                  Continue <i className="bi bi-arrow-right"></i>
                </button>
              ) : (
                <button className="registration-next" type="submit">
                  <i className="bi bi-check-circle"></i> Register & Continue
                </button>
              )}
            </footer>
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

            <div className="login-hint">
              Registration ke time banaya hua username aur password use karein
            </div>

            <button className="btn btn-primary btn-lg w-100 mt-3" type="submit">
              Login
            </button>
            {!isDemoMode && (
              <button
                className="demo-login-btn"
                type="button"
                onClick={() => {
                  setRegistrationStep(1);
                  setIsRegistered(false);
                  setLoginError("");
                }}
              >
                <i className="bi bi-shop"></i>
                Register New Pharmacy
              </button>
            )}
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
            <strong>Free Trial</strong>
            <span>
              {trialDaysLeft} days remaining · Data is saved in this browser
            </span>
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

function RegistrationInput({ name, label, type, required, value, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) =>
          onChange((previous) => ({
            ...previous,
            [e.target.name]: e.target.value,
          }))
        }
        required={required}
      />
    </label>
  );
}

export default App;
