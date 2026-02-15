const ids = [
  "capacity", "occupancy", "ticketPrice", "sponsors", "extras",
  "venueCost", "staffCost", "marketingCost", "productionCost", "otherCost"
];

const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
const calculateBtn = document.getElementById("calculateBtn");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const demoBtn = document.getElementById("demoBtn");
const clearBtn = document.getElementById("clearBtn");
const results = document.getElementById("results");

const revenueValue = document.getElementById("revenueValue");
const costValue = document.getElementById("costValue");
const profitValue = document.getElementById("profitValue");
const marginValue = document.getElementById("marginValue");
const breakevenText = document.getElementById("breakevenText");
const scenarioTable = document.getElementById("scenarioTable");
const pdfReport = document.getElementById("pdfReport");
const pdfGeneratedAt = document.getElementById("pdfGeneratedAt");
const pdfMetrics = document.getElementById("pdfMetrics");
const pdfBreakeven = document.getElementById("pdfBreakeven");
const pdfScenarioTable = document.getElementById("pdfScenarioTable");

let lastCalculation = null;

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

  const rows = [];
  scenarioTable.innerHTML = "";
  for (const s of scenarios) {
    const result = model(state, s.occ, s.price);
    const occupancy = Math.min(100, Math.round(state.occupancy * s.occ));
    const ticketPrice = state.ticketPrice * s.price;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${occupancy}%</td>
      <td>${formatRub(ticketPrice)}</td>
      <td>${formatRub(result.profit)}</td>
    `;
    scenarioTable.appendChild(tr);

    rows.push({
      name: s.name,
      occupancy,
      ticketPrice,
      profit: result.profit
    });
  }

  return rows;
}

function renderPdfReport(snapshot) {
  pdfGeneratedAt.textContent = `Сформирован: ${new Date(snapshot.generatedAt).toLocaleString("ru-RU")}`;

  pdfMetrics.innerHTML = "";
  const metrics = [
    `Ожидаемая выручка: ${formatRub(snapshot.result.revenue)}`,
    `Общие расходы: ${formatRub(snapshot.result.totalCost)}`,
    `Ожидаемая прибыль: ${formatRub(snapshot.result.profit)}`,
    `Маржа: ${snapshot.result.margin.toFixed(1)}%`
  ];

  for (const text of metrics) {
    const li = document.createElement("li");
    li.textContent = text;
    pdfMetrics.appendChild(li);
  }

  if (!Number.isFinite(snapshot.breakeven.tickets) || !Number.isFinite(snapshot.breakeven.occupancy)) {
    pdfBreakeven.textContent = "Точку безубыточности нельзя посчитать: цена билета <= 0.";
  } else {
    pdfBreakeven.textContent = `Для окупаемости нужно продать примерно ${Math.ceil(snapshot.breakeven.tickets)} билетов (${Math.min(999, snapshot.breakeven.occupancy).toFixed(1)}% от вместимости).`;
  }

  pdfScenarioTable.innerHTML = "";
  for (const s of snapshot.scenarios) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.occupancy}%</td>
      <td>${formatRub(s.ticketPrice)}</td>
      <td>${formatRub(s.profit)}</td>
    `;
    pdfScenarioTable.appendChild(tr);
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

  const scenarios = renderScenarios(state);

  lastCalculation = {
    generatedAt: Date.now(),
    state,
    result,
    breakeven: be,
    scenarios
  };

  renderPdfReport(lastCalculation);
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
  pdfReport.classList.add("hidden");
  lastCalculation = null;
}

function exportPdf() {
  if (!lastCalculation) {
    calculate();
  }

  if (!lastCalculation) {
    return;
  }

  renderPdfReport(lastCalculation);
  pdfReport.classList.remove("hidden");
  window.print();
  pdfReport.classList.add("hidden");
}

calculateBtn.addEventListener("click", calculate);
exportPdfBtn.addEventListener("click", exportPdf);
demoBtn.addEventListener("click", loadDemo);
clearBtn.addEventListener("click", resetAll);
