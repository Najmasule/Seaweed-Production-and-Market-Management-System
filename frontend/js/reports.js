// reports.js — Reports module: filter, generate, export CSV, print
import { Api, Auth } from './api.js';
import { Toast, escapeHtml, formatNumber, formatWeight, formatCurrency, formatDate, renderEmptyState, renderErrorState } from './utils.js';

// RBAC: reports are admin/manager only.
if (!Auth.requireRole('admin', 'manager')) {
  // Redirect triggered; inert below.
} else {

const reportData = { summary: null, production: null, inventory: null, market: null, farmers: null, traders: null };

async function loadAllData() {
  const results = await Promise.allSettled([
    Api.get('/farmers/'), Api.get('/traders/'), Api.get('/production/'), Api.get('/inventory/'), Api.get('/market/'),
  ]);
  reportData.farmers = results[0].status === 'fulfilled' ? extract(results[0].value) : [];
  reportData.traders = results[1].status === 'fulfilled' ? extract(results[1].value) : [];
  reportData.production = results[2].status === 'fulfilled' ? extract(results[2].value) : [];
  reportData.inventory = results[3].status === 'fulfilled' ? extract(results[3].value) : [];
  reportData.market = results[4].status === 'fulfilled' ? extract(results[4].value) : [];
}

function extract(v) { return Array.isArray(v) ? v : (v.results || []); }

function getDate(r) { return r.date || r.production_date || r.created_at || r.date_joined || ''; }

function filterByDate(data, from, to) {
  if (!from && !to) return data;
  return data.filter((r) => {
    const d = new Date(getDate(r)); if (isNaN(d)) return false;
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  });
}

async function generateReport() {
  const type = document.getElementById('report-type').value;
  const from = document.getElementById('date-from').value;
  const to = document.getElementById('date-to').value;
  const body = document.getElementById('report-body');
  const title = document.getElementById('report-title');
  const period = document.getElementById('report-period');

  const titles = { summary: 'Summary Report', production: 'Production Report', inventory: 'Inventory Report', market: 'Market Report', farmers: 'Farmers Report', traders: 'Traders Report' };
  title.textContent = titles[type];
  period.textContent = (from || to) ? `${from ? formatDate(from) : 'Start'} — ${to ? formatDate(to) : 'Now'}` : 'All time';

  body.innerHTML = '<div class="spinner-center"><span class="spinner spinner-lg"></span></div>';
  await loadAllData();

  try {
    const fn = { summary: renderSummary, production: renderProductionReport, inventory: renderInventoryReport, market: renderMarketReport, farmers: renderFarmersReport, traders: renderTradersReport }[type];
    fn(from, to, body);
    renderReportStats(type, from, to);
  } catch (err) { renderErrorState(body, err.message || 'Failed to generate report'); }
}

function renderReportStats(type, from, to) {
  const container = document.getElementById('report-stats');
  const farmers = filterByDate(reportData.farmers, from, to);
  const traders = filterByDate(reportData.traders, from, to);
  const production = filterByDate(reportData.production, from, to);
  const inventory = reportData.inventory;
  const totalProd = production.reduce((s, r) => s + (Number(r.quantity || r.weight || 0)), 0);
  const totalInv = inventory.reduce((s, i) => s + (Number(i.quantity || i.stock_level || 0)), 0);
  const totalRev = production.reduce((s, r) => s + (Number(r.total_price || r.revenue || Number(r.price || 0) * Number(r.quantity || 0))), 0);
  container.innerHTML = `
    <div class="stat-card"><div class="stat-card-header"><div class="stat-icon"><i class="fa-solid fa-tractor"></i></div></div><div class="stat-value">${formatNumber(farmers.length)}</div><div class="stat-label">Farmers</div></div>
    <div class="stat-card secondary"><div class="stat-card-header"><div class="stat-icon secondary"><i class="fa-solid fa-handshake"></i></div></div><div class="stat-value">${formatNumber(traders.length)}</div><div class="stat-label">Traders</div></div>
    <div class="stat-card accent"><div class="stat-card-header"><div class="stat-icon accent"><i class="fa-solid fa-seedling"></i></div></div><div class="stat-value">${formatWeight(totalProd)}</div><div class="stat-label">Production</div></div>
    <div class="stat-card info"><div class="stat-card-header"><div class="stat-icon info"><i class="fa-solid fa-dollar-sign"></i></div></div><div class="stat-value">${formatCurrency(totalRev)}</div><div class="stat-label">Revenue</div></div>`;
}

function renderSummary(from, to, body) {
  const farmers = filterByDate(reportData.farmers, from, to);
  const traders = filterByDate(reportData.traders, from, to);
  const production = filterByDate(reportData.production, from, to);
  const inventory = reportData.inventory;
  const market = filterByDate(reportData.market, from, to);
  const totalProd = production.reduce((s, r) => s + (Number(r.quantity || r.weight || 0)), 0);
  const totalInv = inventory.reduce((s, i) => s + (Number(i.quantity || i.stock_level || 0)), 0);
  const avgPrice = market.length ? market.reduce((s, r) => s + (Number(r.price || r.price_per_kg || 0)), 0) / market.length : 0;
  const lowStock = inventory.filter((i) => (Number(i.quantity || i.stock_level || 0)) <= (Number(i.reorder_level || i.min_stock || 10))).length;
  body.innerHTML = `
    <div class="detail-grid" style="padding:0">
      <div class="detail-item"><span class="detail-label">Total Farmers</span><span class="detail-value">${formatNumber(farmers.length)}</span></div>
      <div class="detail-item"><span class="detail-label">Total Traders</span><span class="detail-value">${formatNumber(traders.length)}</span></div>
      <div class="detail-item"><span class="detail-label">Total Production</span><span class="detail-value">${formatWeight(totalProd)}</span></div>
      <div class="detail-item"><span class="detail-label">Current Inventory</span><span class="detail-value">${formatWeight(totalInv)}</span></div>
      <div class="detail-item"><span class="detail-label">Average Market Price</span><span class="detail-value">${formatCurrency(avgPrice)}</span></div>
      <div class="detail-item"><span class="detail-label">Low Stock Items</span><span class="detail-value">${lowStock}</span></div>
      <div class="detail-item"><span class="detail-label">Production Records</span><span class="detail-value">${formatNumber(production.length)}</span></div>
      <div class="detail-item"><span class="detail-label">Market Price Records</span><span class="detail-value">${formatNumber(market.length)}</span></div>
    </div>`;
}

function renderProductionReport(from, to, body) {
  const data = filterByDate(reportData.production, from, to);
  if (!data.length) { renderEmptyState(body, 'No production data for this period', 'fa-seedling'); return; }
  const totalQty = data.reduce((s, r) => s + (Number(r.quantity || r.weight || 0)), 0);
  body.innerHTML = `<p class="text-secondary mb-4">Total production: <strong>${formatWeight(totalQty)}</strong> across ${data.length} records.</p><div class="table-wrapper"><table><thead><tr><th>Date</th><th>Farmer</th><th>Type</th><th>Quantity</th><th>Status</th></tr></thead><tbody>${data.map((r) => `<tr><td>${formatDate(getDate(r))}</td><td>${escapeHtml(r.farmer_name || (r.farmer && r.farmer.name) || '—')}</td><td>${escapeHtml(r.seaweed_type || r.type || '—')}</td><td>${formatWeight(Number(r.quantity || r.weight || 0))}</td><td>${r.status || 'completed'}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderInventoryReport(from, to, body) {
  const data = reportData.inventory;
  if (!data.length) { renderEmptyState(body, 'No inventory data', 'fa-box-open'); return; }
  body.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Item</th><th>Quantity</th><th>Reorder Level</th><th>Unit Price</th><th>Status</th></tr></thead><tbody>${data.map((i) => {
    const qty = Number(i.quantity || i.stock_level || 0); const reorder = Number(i.reorder_level || i.min_stock || 10);
    const status = qty <= 0 ? 'Out of Stock' : qty <= reorder ? 'Low Stock' : 'In Stock';
    return `<tr><td>${escapeHtml(i.seaweed_type || i.name || '—')}</td><td>${formatWeight(qty)}</td><td>${formatWeight(reorder)}</td><td>${i.unit_price || i.price ? formatCurrency(i.unit_price || i.price) : '—'}</td><td>${status}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderMarketReport(from, to, body) {
  const data = filterByDate(reportData.market, from, to);
  if (!data.length) { renderEmptyState(body, 'No market data for this period', 'fa-tag'); return; }
  body.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Type</th><th>Price/kg</th><th>Market</th></tr></thead><tbody>${data.map((r) => `<tr><td>${formatDate(getDate(r))}</td><td>${escapeHtml(r.seaweed_type || r.type || '—')}</td><td>${formatCurrency(Number(r.price || r.price_per_kg || 0))}</td><td>${escapeHtml(r.market || r.market_location || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderFarmersReport(from, to, body) {
  const data = filterByDate(reportData.farmers, from, to);
  if (!data.length) { renderEmptyState(body, 'No farmer data for this period', 'fa-tractor'); return; }
  body.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Name</th><th>Region</th><th>Phone</th><th>Farm Size</th><th>Status</th><th>Registered</th></tr></thead><tbody>${data.map((f) => `<tr><td>${escapeHtml(f.name || f.farmer_name || '—')}</td><td>${escapeHtml(f.region || f.location || '—')}</td><td>${escapeHtml(f.phone || f.phone_number || '—')}</td><td>${f.farm_size || f.farm_size_acres || '—'}</td><td>${f.status || 'active'}</td><td>${formatDate(f.created_at || f.date_joined)}</td></tr>`).join('')}</tbody></table></div>`;
}

function renderTradersReport(from, to, body) {
  const data = filterByDate(reportData.traders, from, to);
  if (!data.length) { renderEmptyState(body, 'No trader data for this period', 'fa-handshake'); return; }
  body.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Location</th><th>Status</th><th>Registered</th></tr></thead><tbody>${data.map((t) => `<tr><td>${escapeHtml(t.name || t.contact_name || '—')}</td><td>${escapeHtml(t.company_name || t.company || '—')}</td><td>${escapeHtml(t.phone || t.phone_number || '—')}</td><td>${escapeHtml(t.location || '—')}</td><td>${t.status || 'active'}</td><td>${formatDate(t.created_at || t.date_joined)}</td></tr>`).join('')}</tbody></table></div>`;
}

// CSV export
function exportCSV() {
  const type = document.getElementById('report-type').value;
  const from = document.getElementById('date-from').value;
  const to = document.getElementById('date-to').value;
  let data, headers, rowFn;
  const mappings = {
    summary: () => { data = filterByDate(reportData.production, from, to); headers = ['Date', 'Farmer', 'Type', 'Quantity (kg)', 'Status']; rowFn = (r) => [getDate(r), r.farmer_name || '', r.seaweed_type || r.type || '', r.quantity || r.weight || '', r.status || '']; },
    production: () => { data = filterByDate(reportData.production, from, to); headers = ['Date', 'Farmer', 'Type', 'Quantity (kg)', 'Status']; rowFn = (r) => [getDate(r), r.farmer_name || '', r.seaweed_type || r.type || '', r.quantity || r.weight || '', r.status || '']; },
    inventory: () => { data = reportData.inventory; headers = ['Item', 'Quantity (kg)', 'Reorder Level', 'Unit Price', 'Location']; rowFn = (i) => [i.seaweed_type || i.name || '', i.quantity || i.stock_level || '', i.reorder_level || i.min_stock || '', i.unit_price || i.price || '', i.location || '']; },
    market: () => { data = filterByDate(reportData.market, from, to); headers = ['Date', 'Type', 'Price/kg', 'Market']; rowFn = (r) => [getDate(r), r.seaweed_type || r.type || '', r.price || r.price_per_kg || '', r.market || '']; },
    farmers: () => { data = filterByDate(reportData.farmers, from, to); headers = ['Name', 'Region', 'Phone', 'Email', 'Farm Size', 'Status']; rowFn = (f) => [f.name || f.farmer_name || '', f.region || f.location || '', f.phone || f.phone_number || '', f.email || '', f.farm_size || f.farm_size_acres || '', f.status || '']; },
    traders: () => { data = filterByDate(reportData.traders, from, to); headers = ['Name', 'Company', 'Phone', 'Email', 'Location', 'Status']; rowFn = (t) => [t.name || t.contact_name || '', t.company_name || t.company || '', t.phone || t.phone_number || '', t.email || '', t.location || '', t.status || '']; },
  };
  mappings[type]();
  if (!data.length) { Toast.warning('No data to export.'); return; }
  const csv = [headers.join(','), ...data.map((r) => rowFn(r).map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `seaweed_${type}_report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  URL.revokeObjectURL(url);
  Toast.success('Report exported as CSV.');
}

document.getElementById('generate-btn').addEventListener('click', generateReport);
document.getElementById('print-btn').addEventListener('click', () => window.print());
document.getElementById('export-btn').addEventListener('click', exportCSV);

// Auto-generate summary on load
generateReport();

} // end RBAC gate
