import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [dashboard, setDashboard] = useState({
    totalMedicines: 0,
    totalSuppliers: 0,
    totalPurchases: 0,
    totalSales: 0,
  });

  useEffect(() => {
    axios
      .get("http://localhost:8080/api/dashboard")
      .then((response) => {
        setDashboard(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div className="container mt-5">
      <h1>PharmaSathi Dashboard</h1>

      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card p-3">
            <h5>Total Medicines</h5>
            <h2>{dashboard.totalMedicines}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>Total Suppliers</h5>
            <h2>{dashboard.totalSuppliers}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>Total Purchases</h5>
            <h2>{dashboard.totalPurchases}</h2>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card p-3">
            <h5>Total Sales</h5>
            <h2>{dashboard.totalSales}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;