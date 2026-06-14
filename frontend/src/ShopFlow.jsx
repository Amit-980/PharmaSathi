const steps = [
  {
    id: "supplier",
    number: "1",
    title: "Supplier",
    meaning: "Manage distributors and vendors",
    effect: "No stock change",
  },
  {
    id: "medicine",
    number: "2",
    title: "Medicine",
    meaning: "Create medicine and batch records",
    effect: "Adds an item to the catalog",
  },
  {
    id: "purchase",
    number: "3",
    title: "Purchase",
    meaning: "Record stock received from suppliers",
    effect: "Increases stock (+)",
  },
  {
    id: "sale",
    number: "4",
    title: "Billing",
    meaning: "Create customer invoices",
    effect: "Decreases stock (-)",
  },
];

function ShopFlow({ active, onNavigate }) {
  return (
    <section className="module-flow" aria-label="Dukaan ka kaam">
      <div className="module-flow-title">
        <strong>Pharmacy workflow</strong>
        <span>Follow these modules from left to right</span>
      </div>
      <div className="module-flow-steps">
        {steps.map((step) => (
          <button
            className={active === step.id ? "active" : ""}
            key={step.id}
            type="button"
            onClick={() => onNavigate(step.id)}
          >
            <b>{step.number}</b>
            <span>
              <strong>{step.title}</strong>
              <small>{step.meaning}</small>
              <em>{step.effect}</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default ShopFlow;
