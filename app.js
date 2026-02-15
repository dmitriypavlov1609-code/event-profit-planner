const ids = [
  "capacity", "occupancy", "ticketPrice", "sponsors", "extras",
  "venueCost", "staffCost", "marketingCost", "productionCost", "otherCost"
];

const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const calculateBtn = document.getElementById("calculateBtn");
const demoBtn = document.getElementById("demoBtn");
const clearBtn = document.getElementById("clearBtn");
const results = document.getElementById("results");

const revenueValue = document.getElementById("revenueValue");
const costValue = document.getElementById("costValue");
const profitValue = document.getElementById("profitValue");
const marginValue = document.getElementById("marginValue");
const breakevenText = document.getElementById("breakevenText");
const scenarioTable = document.getElementById("scenarioTable");

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRub(value) {
  return new Intl.NumberFormat("ru-RU").format(Math.round(value)) + " ₽";
}

function getState() {
  return Object.fromEntries(ids.map((id) => [id, num(elements[id].value)]));
}

function model(state, occupancyFactor = 1, priceFactor = 1) {
  const soldTickets = state.capacity * (state.occupancy / 100) * occupancyFactor;
  const ticketRevenue = soldTickets * state.ticketPrice * priceFactor;
  const revenue = ticketRevenue + state.sponsors + state.extras;
  const totalCost = state.venueCost + state.staffCost + state.marketingCost + state.productionCost + state.otherCost;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { soldTickets, revenue, totalCost, profit, margin };
}

function breakeven(state) {
  const fixedCost = state.venueCost + state.staffCost + state.marketingCost + state.productionCost + state.otherCost;
  const nonTicketRevenue = state.sponsors + state.extras;
  const requiredTicketRevenue = Math.max(0, fixedCost - nonTicketRevenue);

  if (state.ticketPrice <= 0) {
    return { tickets: Infinity, occupancy: Infinity };
  }

  const tickets = requiredTicketRevenue / state.ticketPrice;
  const occupancy = state.capacity > 0 ? (tickets / state.capacity) * 100 : Infinity;
  return { tickets, occupancy };
}

function renderScenarios(state) {
  const scenarios = [
    { name: "Пессимистичный", occ: 0.8, price: 0.9 },
    { name: "Базовый", occ: 1, price: 1 },
    { name: "Оптимистичный", occ: 1.15, price: 1.08 }
  ];

  scenarioTable.innerHTML = "";
  for (const s of scenarios) {
    const result = model(state, s.occ, s.price);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${Math.min(100, Math.round(state.occupancy * s.occ))}%</td>
      <td>${formatRub(state.ticketPrice * s.price)}</td>
      <td>${formatRub(result.profit)}</td>
    `;
    scenarioTable.appendChild(tr);
  }
}

function calculate() {
  const state = getState();
  const result = model(state);
  const be = breakeven(state);

  revenueValue.textContent = formatRub(result.revenue);
  costValue.textContent = formatRub(result.totalCost);
  profitValue.textContent = formatRub(result.profit);
  marginValue.textContent = `${result.margin.toFixed(1)}%`;

  if (!Number.isFinite(be.tickets) || !Number.isFinite(be.occupancy)) {
    breakevenText.textContent = "Точку безубыточности нельзя посчитать: укажите цену билета больше 0.";
  } else {
    breakevenText.textContent = `Для окупаемости нужно продать примерно ${Math.ceil(be.tickets)} билетов (${Math.min(999, be.occupancy).toFixed(1)}% от вместимости).`;
  }

  renderScenarios(state);
  results.classList.remove("hidden");
}

function loadDemo() {
  const demo = {
    capacity: 250,
    occupancy: 68,
    ticketPrice: 3200,
    sponsors: 120000,
    extras: 70000,
    venueCost: 180000,
    staffCost: 110000,
    marketingCost: 90000,
    productionCost: 130000,
    otherCost: 45000
  };

  for (const [key, value] of Object.entries(demo)) {
    elements[key].value = value;
  }

  calculate();
}

function resetAll() {
  for (const id of ids) {
    elements[id].value = 0;
  }
  elements.capacity.value = 120;
  elements.occupancy.value = 75;
  elements.ticketPrice.value = 2500;
  results.classList.add("hidden");
}

calculateBtn.addEventListener("click", calculate);
demoBtn.addEventListener("click", loadDemo);
clearBtn.addEventListener("click", resetAll);
