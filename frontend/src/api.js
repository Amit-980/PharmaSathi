import axios from "axios";

const isDemoMode =
  new URLSearchParams(window.location.search).get("demo") === "1" ||
  import.meta.env.VITE_DEMO_MODE === "true";

const demoSeed = {
  medicines: [
    { id: 1, name: "Paracetamol 500", brand: "Dolo", sku: "MED-001", barcode: "890000000001", hsnCode: "3004", unit: "Strip", packSize: 10, batchNo: "DL2408", expiryDate: "2027-08-31", purchasePrice: 24, wholesalePrice: 30, mrp: 35, gstRate: 5, stockQuantity: 86, minimumStock: 20 },
    { id: 2, name: "Azithromycin 500", brand: "Azee", batchNo: "AZ2511", expiryDate: "2027-11-30", mrp: 125, gstRate: 5, stockQuantity: 24 },
    { id: 3, name: "ORS Sachet", brand: "Electral", batchNo: "OR2504", expiryDate: "2027-04-30", mrp: 24, gstRate: 5, stockQuantity: 9 },
    { id: 4, name: "Vitamin D3", brand: "Uprise", batchNo: "UP2509", expiryDate: "2027-09-30", mrp: 145, gstRate: 5, stockQuantity: 0 },
  ],
  suppliers: [
    { id: 1, name: "HealthCare Distributors", phone: "9876543210", email: "orders@healthcare.demo", address: "Lucknow, Uttar Pradesh" },
    { id: 2, name: "MediLife Agencies", phone: "9123456780", email: "sales@medilife.demo", address: "Kanpur, Uttar Pradesh" },
  ],
  purchases: [
    { id: 1, medicineId: 1, supplierId: 1, quantity: 100, purchasePrice: 24, purchaseDate: "2026-05-20" },
    { id: 2, medicineId: 2, supplierId: 2, quantity: 30, purchasePrice: 92, purchaseDate: "2026-05-28" },
  ],
  sales: [
    { id: 1, customerPhone: "9876501234", medicineId: 1, quantity: 4, sellingPrice: 32, saleDate: "2026-06-03" },
    { id: 2, customerPhone: "9876505678", medicineId: 2, quantity: 2, sellingPrice: 120, saleDate: "2026-06-05" },
  ],
};

const demoStoreKey = "pharmasathi-demo-data";

const readDemoData = () => {
  try {
    return JSON.parse(localStorage.getItem(demoStoreKey)) || structuredClone(demoSeed);
  } catch {
    return structuredClone(demoSeed);
  }
};

const writeDemoData = (data) => {
  localStorage.setItem(demoStoreKey, JSON.stringify(data));
};

const demoAdapter = async (config) => {
  const data = readDemoData();
  const path = new URL(config.url, "http://demo.local").pathname
    .replace(/^\/api\/?/, "")
    .replace(/^\/+/, "");
  const [resource, idText] = path.split("/");
  const id = Number(idText);
  const method = (config.method || "get").toLowerCase();

  if (resource === "dashboard" && method === "get") {
    return response(config, {
      totalMedicines: data.medicines.length,
      totalSuppliers: data.suppliers.length,
      totalPurchases: data.purchases.length,
      totalSales: data.sales.length,
    });
  }

  if (!Object.hasOwn(data, resource)) {
    return Promise.reject(new Error("Demo endpoint not found"));
  }

  if (method === "get") {
    return response(config, id ? data[resource].find((item) => item.id === id) : data[resource]);
  }

  const payload = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  if (method === "post") {
    const item = { ...payload, id: Math.max(0, ...data[resource].map((entry) => entry.id)) + 1 };
    data[resource].push(item);
    if (resource === "sales") {
      const medicine = data.medicines.find((entry) => entry.id === item.medicineId);
      if (medicine) medicine.stockQuantity -= Number(item.quantity || 0);
    }
    if (resource === "purchases") {
      const medicine = data.medicines.find((entry) => entry.id === item.medicineId);
      if (medicine) medicine.stockQuantity += Number(item.quantity || 0);
    }
    writeDemoData(data);
    return response(config, item, 201);
  }

  if (method === "put") {
    const index = data[resource].findIndex((item) => item.id === id);
    data[resource][index] = { ...data[resource][index], ...payload, id };
    writeDemoData(data);
    return response(config, data[resource][index]);
  }

  if (method === "delete") {
    const deleted = data[resource].find((item) => item.id === id);
    if (resource === "sales" && deleted) {
      const medicine = data.medicines.find((entry) => entry.id === deleted.medicineId);
      if (medicine) medicine.stockQuantity += Number(deleted.quantity || 0);
    }
    if (resource === "purchases" && deleted) {
      const medicine = data.medicines.find((entry) => entry.id === deleted.medicineId);
      if (medicine && medicine.stockQuantity >= Number(deleted.quantity || 0)) {
        medicine.stockQuantity -= Number(deleted.quantity || 0);
      }
    }
    data[resource] = data[resource].filter((item) => item.id !== id);
    writeDemoData(data);
    return response(config, null, 204);
  }

  return Promise.reject(new Error("Demo operation not supported"));
};

const response = (config, data, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config,
});

const api = axios.create({
  baseURL: isDemoMode
    ? "/api"
    : import.meta.env.VITE_API_URL ||
      (window.location.port.startsWith("517")
        ? "http://localhost:8765/api"
        : "/api"),
  adapter: isDemoMode ? demoAdapter : undefined,
});

if (!isDemoMode) {
  api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("pharmasathi-auth-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export { isDemoMode };
export default api;
