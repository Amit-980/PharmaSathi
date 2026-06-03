import { useState } from "react";
import Dashboard from "./Dashboard";
import Purchase from "./Purchase";
import Sale from "./Sale";
import Medicine from "./Medicine";
import Supplier from "./Supplier";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");

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
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            💊 PharmaSathi
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    currentPage === "dashboard" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("dashboard");
                  }}
                >
                  Dashboard
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    currentPage === "medicine" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("medicine");
                  }}
                >
                  Medicines
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    currentPage === "supplier" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("supplier");
                  }}
                >
                  Suppliers
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${
                    currentPage === "purchase" ? "active" : ""
                  }`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("purchase");
                  }}
                >
                  Purchase
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${currentPage === "sale" ? "active" : ""}`}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage("sale");
                  }}
                >
                  Sale
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div>{renderPage()}</div>
    </div>
  );
}

export default App;