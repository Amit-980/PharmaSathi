const plans = [
  {
    name: "Starter",
    price: "₹499",
    note: "Small pharmacy",
    features: ["Billing & inventory", "Supplier and purchase records", "Basic reports"],
  },
  {
    name: "Business",
    price: "₹999",
    note: "Growing pharmacy",
    featured: true,
    features: ["Everything in Starter", "GST and CA audit reports", "Cloud backup and support"],
  },
  {
    name: "Pro",
    price: "₹1,499",
    note: "Multi-user pharmacy",
    features: ["Everything in Business", "Staff access controls", "Priority support"],
  },
];

function Plans() {
  return (
    <main className="plans-page">
      <header className="plans-header">
        <p>PharmaSathi subscription</p>
        <h1>Simple plans for every pharmacy</h1>
        <span>Monthly billing · Upgrade or cancel anytime</span>
      </header>
      <section className="plans-grid">
        {plans.map((plan) => (
          <article className={`plan-card ${plan.featured ? "featured" : ""}`} key={plan.name}>
            {plan.featured && <b>Recommended</b>}
            <p>{plan.note}</p>
            <h2>{plan.name}</h2>
            <div><strong>{plan.price}</strong><span>/ month</span></div>
            <ul>
              {plan.features.map((feature) => <li key={feature}><i className="bi bi-check-circle-fill"></i>{feature}</li>)}
            </ul>
            <button type="button" onClick={() => window.alert("Demo only: online payment activation deployment ke samay connect hoga.")}>
              Choose Plan
            </button>
          </article>
        ))}
      </section>
      <div className="plans-note">
        Free trial में payment नहीं लिया जाएगा. Trial के बाद PharmaSathi owner subscription activate करेगा.
      </div>
    </main>
  );
}

export default Plans;
