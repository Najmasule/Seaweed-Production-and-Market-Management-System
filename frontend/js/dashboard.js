import { Api } from './api.js';
import { Toast, formatNumber, formatWeight, formatCurrency, formatDate, escapeHtml } from './utils.js';

let charts = {};

async function loadDashboard() {
  try {
    const [farmers, traders, production, inventory] = await Promise.allSettled([
      Api.get('/farmers/'),
      Api.get('/traders/'),
      Api.get('/production/'),
      Api.get('/inventory/'),
    ]);

    const farmersData = extractResults(farmers);
    const tradersData = extractResults(traders);
    const productionData = extractResults(production);
    const inventoryData = extractResults(inventory);

    renderStats(farmersData, tradersData, productionData, inventoryData);
    renderProductionChart(productionData);
    renderInventoryChart(inventoryData);
    renderFarmersChart(farmersData);
    renderSalesChart(productionData, inventoryData);
    renderRecentActivities(farmersData, productionData, inventoryData, tradersData);
    renderInventoryStatus(inventoryData);
    renderLowStockAlert(inventoryData);
  } catch (err) {
    Toast.error('Failed to load dashboard data.');
    console.error(err);
  }
}

function extractResults(settledResult) {
  if (settledResult.status !== 'fulfilled') return [];
  const val = settledResult.value;
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.results)) return val.results;
  if (val && typeof val === 'object') return [val];
  return [];
}

function renderStats(farmers, traders, production, inventory) {
  document.getElementById('stat-farmers').textContent = formatNumber(farmers.length);
  document.getElementById('stat-traders').textContent = formatNumber(traders.length);

  const totalProd = production.reduce((sum, p) => sum + (Number(p.quantity) || Number(p.weight) || 0), 0);
  document.getElementById('stat-production').textContent = formatNumber(Math.round(totalProd));

  document.getElementById('stat-inventory').textContent = formatNumber(inventory.length);

  setTrend('farmers-trend', farmers, (r) => r.created_at || r.date_joined);
  setTrend('traders-trend', traders, (r) => r.created_at || r.date_joined);
  setTrend('production-trend', production, (r) => r.date || r.production_date);

  const lowCount = inventory.filter((i) => isLowStock(i)).length;
  const badge = document.getElementById('inventory-trend-badge');
  if (badge) {
    if (lowCount > 0) {
      badge.className = 'stat-trend down';
      badge.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${lowCount} low`;
    } else {
      badge.className = 'stat-trend up';
      badge.innerHTML = `<i class="fa-solid fa-arrow-up"></i> OK`;
    }
  }
}

function setTrend(elId, records, dateFn) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!records.length) {
    el.textContent = '0';
    return;
  }
  const now = new Date();
  const thisMonth = records.filter((r) => {
    const dateVal = dateFn(r);
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return !isNaN(d) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  el.textContent = thisMonth > 0 ? `+${thisMonth}` : '0';
}

function isLowStock(item) {
  const qty = Number(item.quantity || item.stock_level || item.current_stock || 0);
  const threshold = Number(item.reorder_level || item.min_stock || item.threshold || 10);
  return qty <= threshold;
}

function getChartColors() {
  return {
    primary: '#0F766E', secondary: '#10B981', accent: '#F59E0B',
    info: '#3B82F6', error: '#EF4444',
    palette: ['#0F766E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  };
}

function renderProductionChart(production) {
  const ctx = document.getElementById('chart-production');
  if (!ctx) return;
  const colors = getChartColors();
  const months = getLast12Months();
  const dataByMonth = {};
  months.forEach((m) => (dataByMonth[m.key] = 0));

  production.forEach((p) => {
    const d = new Date(p.date || p.production_date || 0);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (dataByMonth[key] !== undefined) dataByMonth[key] += Number(p.quantity || p.weight || 0);
  });

  if (charts.production) charts.production.destroy();
  charts.production = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months.map((m) => m.label),
      datasets: [{
        label: 'Production (kg)',
        data: months.map((m) => Math.round(dataByMonth[m.key])),
        borderColor: colors.primary,
        backgroundColor: 'rgba(15,118,110,0.1)',
        fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: colors.primary
      }],
    },
    options: chartOpts({ plugins: { legend: { display: false } } }),
  });
}

function renderInventoryChart(inventory) {
  const ctx = document.getElementById('chart-inventory');
  if (!ctx) return;
  const colors = getChartColors();
  const byType = {};

  inventory.forEach((i) => {
    const type = i.seaweed_type || i.type || i.name || 'Unknown';
    byType[type] = (byType[type] || 0) + Number(i.quantity || i.stock_level || i.current_stock || 0);
  });

  const labels = Object.keys(byType);
  if (charts.inventory) charts.inventory.destroy();
  charts.inventory = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: labels.map((l) => byType[l]), backgroundColor: colors.palette, borderWidth: 0 }] },
    options: chartOpts({ cutout: '65%', plugins: { legend: { position: 'bottom' } } }, true),
  });
}

function renderFarmersChart(farmers) {
  const ctx = document.getElementById('chart-farmers');
  if (!ctx) return;
  const colors = getChartColors();
  const byRegion = {};

  farmers.forEach((f) => {
    // Kagua location kwanza kwa sababu ndio iliyopo kwenye Django Model yetu
    const region = f.location || f.region || f.area || 'Unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;
  });

  const labels = Object.keys(byRegion);
  if (charts.farmers) charts.farmers.destroy();
  charts.farmers = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Farmers', data: labels.map((l) => byRegion[l]), backgroundColor: colors.secondary, borderRadius: 6, maxBarThickness: 40 }] },
    options: chartOpts({ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }),
  });
}

function renderSalesChart(production, inventory) {
  const ctx = document.getElementById('chart-sales');
  if (!ctx) return;
  const colors = getChartColors();
  const months = getLast12Months();
  const dataByMonth = {};
  months.forEach((m) => (dataByMonth[m.key] = 0));

  const allRecords = [...production];
  allRecords.forEach((r) => {
    const d = new Date(r.date || r.production_date || r.sale_date || 0);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const revenue = Number(r.total_price || r.revenue || r.price * (r.quantity || r.weight || 0) || 0);
    if (dataByMonth[key] !== undefined) dataByMonth[key] += revenue;
  });

  if (charts.sales) charts.sales.destroy();
  charts.sales = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map((m) => m.label),
      datasets: [{ label: 'Sales (TZS)', data: months.map((m) => Math.round(dataByMonth[m.key])), backgroundColor: colors.accent, borderRadius: 6, maxBarThickness: 30 }],
    },
    options: chartOpts({ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => 'Tsh ' + formatNumber(v) } } } }),
  });
}

function getLast12Months() {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-US', { month: 'short' }) });
  }
  return months;
}

function chartOpts(extra = {}, isDoughnut = false) {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 16 } } }
  };

  // Kwenye Chart.js v4, usifute scales kabisa, weka muundo kulingana na aina ya graph
  if (!isDoughnut) {
    base.scales = {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: '#F1F5F9' }, ticks: { font: { family: 'Inter', size: 11 } } }
    };
  }
  return { ...base, ...extra };
}

function renderRecentActivities(farmers, production, inventory, traders) {
  const container = document.getElementById('recent-activities');
  if (!container) return;
  const activities = [];

  farmers.slice(0, 3).forEach((f) => activities.push({ icon: 'fa-tractor', color: 'primary', title: `New farmer registered: ${f.name || f.username || 'Unknown'}`, time: f.created_at || f.date_joined }));
  production.slice(0, 3).forEach((p) => activities.push({ icon: 'fa-seedling', color: 'secondary', title: `Production recorded: ${formatWeight(p.quantity || p.weight || 0)}`, time: p.date || p.production_date }));
  inventory.slice(0, 2).forEach((i) => activities.push({ icon: 'fa-box', color: 'accent', title: `Inventory updated: ${i.seaweed_type || i.name || 'Item'}`, time: i.updated_at || i.created_at }));
  traders.slice(0, 2).forEach((t) => activities.push({ icon: 'fa-handshake', color: 'info', title: `Trader added: ${t.name || t.company_name || t.username || 'Trader'}`, time: t.created_at || t.date_joined }));

  activities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  if (!activities.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-clock"></i><p>No recent activity</p></div>';
    return;
  }
  container.innerHTML = `<div class="activity-list">${activities.slice(0, 8).map((a) => `
    <div class="activity-item">
      <div class="activity-dot ${a.color}"></div>
      <div class="activity-content">
        <div class="activity-title">${escapeHtml(a.title)}</div>
        <div class="activity-time">${formatDate(a.time)}</div>
      </div>
    </div>`).join('')}</div>`;
}

function renderInventoryStatus(inventory) {
  const container = document.getElementById('inventory-status');
  if (!container) return;
  if (!inventory.length) {
    container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-box-open"></i><p>No inventory items</p></div>';
    return;
  }
  const top = inventory.slice(0, 6);
  container.innerHTML = top.map((item) => {
    const qty = Number(item.quantity || item.stock_level || item.current_stock || 0);
    const threshold = Number(item.reorder_level || item.min_stock || item.threshold || 10);
    const pct = Math.min(100, threshold > 0 ? (qty / (threshold * 2)) * 100 : 50);
    const low = isLowStock(item);
    return `<div class="inv-status-item">
      <div class="inv-status-info">
        <div><div class="inv-status-name">${escapeHtml(item.seaweed_type || item.name || 'Item')}</div><div class="inv-status-meta">${formatWeight(qty)} • Threshold: ${formatWeight(threshold)}</div></div>
      </div>
      <div style="width:100px"><div class="progress-bar"><div class="progress-bar-fill ${low ? 'error' : 'success'}" style="width:${pct}%"></div></div></div>
    </div>`;
  }).join('');
}

function renderLowStockAlert(inventory) {
  const lowCount = inventory.filter(isLowStock).length;
  const alert = document.getElementById('low-stock-alert');
  if (!alert) return;

  if (lowCount > 0) {
    const countEl = document.getElementById('alert-count');
    if (countEl) countEl.textContent = lowCount;
    alert.classList.remove('hidden');
  } else {
    alert.classList.add('hidden'); // Hakikisha inajificha kama kila kitu kipo sawa
  }
}

document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
  Toast.info('Refreshing dashboard…');
  loadDashboard();
});

function loadChartJS() {
  return new Promise((resolve) => {
    if (window.Chart) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    script.onload = () => resolve();
    script.onerror = () => { Toast.error('Failed to load charts library.'); resolve(); };
    document.head.appendChild(script);
  });
}

async function init() {
  await loadChartJS();
  loadDashboard();
}
init();