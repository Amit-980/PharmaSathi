const steps = [
  {
    id: "supplier",
    number: "1",
    title: "Supplier",
    meaning: "Jisse aap dawa kharidte hain",
    effect: "Stock par koi asar nahi",
  },
  {
    id: "medicine",
    number: "2",
    title: "Medicine",
    meaning: "Dawai ka naam aur batch banayein",
    effect: "Item list mein judta hai",
  },
  {
    id: "purchase",
    number: "3",
    title: "Purchase",
    meaning: "Supplier se aaya maal darj karein",
    effect: "Stock badhta hai (+)",
  },
  {
    id: "sale",
    number: "4",
    title: "Billing",
    meaning: "Customer ko dawa bechein",
    effect: "Stock ghatta hai (-)",
  },
];

function ShopFlow({ active, onNavigate }) {
  return (
    <section className="module-flow" aria-label="Dukaan ka kaam">
      <div className="module-flow-title">
        <strong>Ye 4 alag kaam hain</strong>
        <span>Baayein se daayein isi kram mein use karein</span>
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
