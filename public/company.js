// =====================================================
// Harit Setu – Company / MNC Portal JS
// Auth-guarded | 5 Tabs | Charts | Marketplace | API
// =====================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBrG7N9APcg0x58UuolZxTOMIcSgdoobA",
  authDomain: "harit-setu-55e7a.firebaseapp.com",
  projectId: "harit-setu-55e7a",
  storageBucket: "harit-setu-55e7a.firebasestorage.app",
  messagingSenderId: "679849739065",
  appId: "1:679849739065:web:0b12892c4c5c283def1ee8"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ─── AUTH GUARD ───────────────────────────────────────────────────────────
let authInit = false;
const unsub = onAuthStateChanged(auth, (user) => {
  authInit = true;
  unsub();
  if (user) {
    initPortal(user);
  } else {
    window.location.href = "index.html";
  }
});
setTimeout(() => { if (!authInit) window.location.href = "index.html"; }, 4000);

// ─── SIGN OUT ─────────────────────────────────────────────────────────────
document.getElementById("cSignOutBtn")?.addEventListener("click", async () => {
  localStorage.removeItem("hs_user_role");
  await signOut(auth);
  window.location.href = "index.html";
});

const ADMIN_EMAILS = [
  "admin@haritsetu.com",
  "yadu@haritsetu.com",
  "metasquad@haritsetu.com"
];



// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════
function initPortal(user) {
  document.getElementById("authLoader").classList.add("hidden");
  document.getElementById("companyApp").classList.remove("hidden");

  const name = user.displayName ? user.displayName.split(" ")[0] : "Company";
  document.getElementById("cUserName").textContent = user.displayName || user.email;
  document.getElementById("cWelcomeName").textContent = name;
  document.getElementById("cAvatar").textContent = name[0].toUpperCase();

  // Show API Tab only for admins
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    const apiBtn = document.getElementById("apiTabBtn");
    if (apiBtn) apiBtn.style.display = "flex";
  }

  setupTabs();
  buildOverview();
  buildMarketplace();
  buildPortfolio();
  buildESG();
  buildAPI();

  // Ticker tick
  setInterval(tickTicker, 5000);
}

// ─── TABS ─────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".c-tab").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      document.querySelectorAll(".c-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".c-tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      
      const content = document.getElementById(`c-tab-${tab}`);
      if (content) {
        content.classList.add("active");
        window.dispatchEvent(new Event('resize'));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = el.dataset.goto;
      
      document.querySelectorAll(".c-tab").forEach(b => b.classList.remove("active"));
      const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
      if (targetBtn) targetBtn.classList.add("active");

      document.querySelectorAll(".c-tab-content").forEach(c => c.classList.remove("active"));
      const content = document.getElementById(`c-tab-${tab}`);
      if (content) {
        content.classList.add("active");
        window.dispatchEvent(new Event('resize'));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Code snippet tabs
  document.querySelectorAll(".c-code-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".c-code-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".c-code-block").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`code-${btn.dataset.lang}`).classList.add("active");
    });
  });
}

// ─── TICKER ──────────────────────────────────────────────────────────────
let tickerBase = 487;
function tickTicker() {
  const delta = (Math.random() - 0.48) * 6;
  tickerBase = +(tickerBase + delta).toFixed(0);
  const pct = (((tickerBase - 487) / 487) * 100).toFixed(1);
  const el = document.getElementById("tickerPrice");
  const ce = document.getElementById("tickerChange");
  if (el) el.textContent = `₹${tickerBase}`;
  if (ce) {
    ce.textContent = `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}%`;
    ce.className = `c-ticker-change ${pct >= 0 ? "positive" : "negative"}`;
  }
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────
function animCount(id, from, to, dur, pre, suf) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const v = Math.round(from + (to - from) * e);
    el.textContent = pre + v.toLocaleString("en-IN") + suf;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const CHART_OPT = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(59,130,246,0.3)", borderWidth: 1 } },
  scales: {
    x: { ticks: { color: "#2a3f5f", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.03)" } },
    y: { ticks: { color: "#2a3f5f", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.03)" } }
  }
};

// ═══════════════════════════════════════════════════════════════════
// OVERVIEW
// ═══════════════════════════════════════════════════════════════════
function buildOverview() {
  animCount("kpi-co2", 0, 96540, 1400, "", " t");
  animCount("kpi-wallet", 0, 3840, 1400, "", " t");
  animCount("kpi-spend", 0, 4712000, 1400, "₹", "");

  buildEmissionsDonut();
  buildSpendChart();
  buildRecentPurchasesTable();
}

function buildEmissionsDonut() {
  const ctx = document.getElementById("emissionsDonut");
  if (!ctx) return;
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Scope 1", "Scope 2", "Scope 3", "Offset"],
      datasets: [{
        data: [38000, 52000, 52000, 96540],
        backgroundColor: ["#ef4444","#f59e0b","#a78bfa","#22c55e"],
        borderColor: "#0d1526", borderWidth: 3,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: "#0d1526", borderColor: "rgba(59,130,246,0.3)", borderWidth: 1 }
      }
    }
  });
}

const MONTHS = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const SPEND_DATA = [280000,310000,350000,320000,380000,420000,395000,445000,510000,480000,565000,257000];

function buildSpendChart() {
  const ctx = document.getElementById("spendChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS,
      datasets: [{
        data: SPEND_DATA,
        backgroundColor: SPEND_DATA.map((v, i) => i === 11 ? "rgba(59,130,246,0.9)" : "rgba(59,130,246,0.4)"),
        borderRadius: 5, borderColor: "#3b82f6", borderWidth: 1
      }]
    },
    options: { ...CHART_OPT, scales: { x: { ...CHART_OPT.scales.x, grid: { display: false } }, y: { ...CHART_OPT.scales.y, ticks: { color: "#2a3f5f", callback: v => "₹" + (v/1000) + "K" } } } }
  });
}

const RECENT_PURCHASES = [
  { date: "05 Apr 2025", id: "HS-CR-00198", farmer: "Anandan K.",   region: "Kerala",      co2: 120, price: "₹58,440", status: "Active" },
  { date: "04 Apr 2025", id: "HS-CR-00195", farmer: "Lakshmi Bai",  region: "Tamil Nadu",  co2: 85,  price: "₹40,885", status: "Active" },
  { date: "02 Apr 2025", id: "HS-CR-00192", farmer: "Raghav S.",    region: "Andhra Pradesh", co2: 200, price: "₹97,000", status: "Retired" },
  { date: "30 Mar 2025", id: "HS-CR-00184", farmer: "Meena Devi",   region: "Bihar",       co2: 60,  price: "₹29,280", status: "Expiring" },
  { date: "25 Mar 2025", id: "HS-CR-00178", farmer: "Harpal Singh", region: "Punjab",      co2: 180, price: "₹87,300", status: "Retired" },
];

function buildRecentPurchasesTable() {
  const el = document.getElementById("recentPurchases");
  if (!el) return;
  el.innerHTML = RECENT_PURCHASES.map(r => `
    <div class="c-table-row">
      <span>${r.date}</span>
      <span style="font-family:monospace;font-size:0.75rem;color:#6b8fbf">${r.id}</span>
      <span>${r.farmer}</span>
      <span>${r.region}</span>
      <span style="font-weight:700;color:#e8f0ff">${r.co2} t</span>
      <span style="color:#60a5fa;font-weight:700">${r.price}</span>
      <span class="c-status-${r.status.toLowerCase()}">${
        r.status === "Retired"  ? "✅ Retired" :
        r.status === "Expiring" ? "⏳ Expiring" : "🔵 Active"
      }</span>
    </div>
  `).join("");
}

// ═══════════════════════════════════════════════════════════════════
// MARKETPLACE
// ═══════════════════════════════════════════════════════════════════
const MARKET_CREDITS = [
  { id:"MKT-001", farmer:"Anandan Krishnan",   location:"Thrissur, Kerala",      crop:"Paddy",    co2:240, price:485, ndvi:0.82, verra:true },
  { id:"MKT-002", farmer:"Suresh Pillai",       location:"Kottayam, Kerala",      crop:"Coconut",  co2:180, price:510, ndvi:0.91, verra:true },
  { id:"MKT-003", farmer:"Raghunath Reddy",     location:"Guntur, Andhra Pradesh",crop:"Paddy",    co2:420, price:462, ndvi:0.74, verra:true },
  { id:"MKT-004", farmer:"Meena Devi",          location:"Patna, Bihar",          crop:"Wheat",    co2:160, price:445, ndvi:0.68, verra:true },
  { id:"MKT-005", farmer:"Harpal Singh",        location:"Amritsar, Punjab",      crop:"Wheat",    co2:380, price:471, ndvi:0.79, verra:true },
  { id:"MKT-006", farmer:"Lakshmi Bai",         location:"Thanjavur, Tamil Nadu", crop:"Paddy",    co2:290, price:498, ndvi:0.76, verra:true },
  { id:"MKT-007", farmer:"Gopal Krishnamurthy", location:"Coimbatore, Tamil Nadu",crop:"Sugarcane",co2:510, price:453, ndvi:0.71, verra:false },
  { id:"MKT-008", farmer:"Fatima Bibi",         location:"Nanded, Maharashtra",   crop:"Cotton",   co2:140, price:435, ndvi:0.64, verra:false },
  { id:"MKT-009", farmer:"Birsa Munda",         location:"Ranchi, Jharkhand",     crop:"Paddy",    co2:95,  price:468, ndvi:0.77, verra:true },
  { id:"MKT-010", farmer:"Kamala Devi",         location:"Rohtak, Haryana",       crop:"Wheat",    co2:210, price:489, ndvi:0.80, verra:true },
];

let buyTarget = null;

function buildMarketplace() {
  const total = MARKET_CREDITS.reduce((s, c) => s + c.co2, 0);
  const av = document.getElementById("mktAvailable");
  if (av) av.textContent = total.toLocaleString("en-IN") + " t CO₂";

  renderCreditsGrid(MARKET_CREDITS);
  setupFilters();
  setupBuyModal();
}

function renderCreditsGrid(credits) {
  const grid = document.getElementById("creditsGrid");
  if (!grid) return;
  if (credits.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#2a3f5f;padding:3rem">No credits match your filters.</div>`;
    return;
  }
  grid.innerHTML = credits.map(c => `
    <div class="c-credit-card">
      <div class="c-cc-top">
        <div>
          <div class="c-cc-farmer">${c.farmer}</div>
          <div class="c-cc-location">📍 ${c.location}</div>
        </div>
        ${c.verra ? '<span class="c-verra-badge">✅ Verra</span>' : ''}
      </div>
      <div class="c-cc-stats">
        <div class="c-cc-stat">
          <div class="c-cc-stat-label">Available</div>
          <div class="c-cc-stat-val">${c.co2} t</div>
        </div>
        <div class="c-cc-stat">
          <div class="c-cc-stat-label">Price/t</div>
          <div class="c-cc-stat-val price">₹${c.price}</div>
        </div>
        <div class="c-cc-stat">
          <div class="c-cc-stat-label">NDVI Score</div>
          <div class="c-cc-stat-val ndvi">${c.ndvi}</div>
        </div>
        <div class="c-cc-stat">
          <div class="c-cc-stat-label">Vintage</div>
          <div class="c-cc-stat-val" style="font-size:0.9rem">2024–25</div>
        </div>
      </div>
      <div class="c-cc-crop">🌿 ${c.crop} · ISRO Satellite Verified</div>
      <button class="c-btn-buy" data-id="${c.id}">Buy Credits →</button>
    </div>
  `).join("");

  grid.querySelectorAll(".c-btn-buy").forEach(btn => {
    btn.addEventListener("click", () => {
      const credit = MARKET_CREDITS.find(c => c.id === btn.dataset.id);
      openBuyModal(credit);
    });
  });
}

function setupFilters() {
  ["filterRegion","filterCrop","filterPrice","filterVerra","filterNdvi"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", applyFilters);
  });
  document.getElementById("filterReset")?.addEventListener("click", () => {
    document.getElementById("filterRegion").value = "";
    document.getElementById("filterCrop").value = "";
    document.getElementById("filterPrice").value = "";
    document.getElementById("filterVerra").checked = true;
    document.getElementById("filterNdvi").checked = false;
    renderCreditsGrid(MARKET_CREDITS);
  });
}

function applyFilters() {
  const region  = document.getElementById("filterRegion")?.value;
  const crop    = document.getElementById("filterCrop")?.value;
  const price   = document.getElementById("filterPrice")?.value;
  const verra   = document.getElementById("filterVerra")?.checked;
  const highNdvi= document.getElementById("filterNdvi")?.checked;

  const filtered = MARKET_CREDITS.filter(c => {
    if (region  && !c.location.includes(region)) return false;
    if (crop    && c.crop !== crop) return false;
    if (verra   && !c.verra) return false;
    if (highNdvi && c.ndvi < 0.70) return false;
    if (price === "Under ₹400/t" && c.price >= 400) return false;
    if (price === "₹400–₹500/t" && (c.price < 400 || c.price > 500)) return false;
    if (price === "₹500+/t"     && c.price < 500) return false;
    return true;
  });
  renderCreditsGrid(filtered);
}

function openBuyModal(credit) {
  buyTarget = credit;
  const modal = document.getElementById("buyModal");
  const info  = document.getElementById("buyFarmerInfo");
  if (!modal || !info) return;

  info.innerHTML = `
    <strong>${credit.farmer}</strong> · ${credit.location}<br>
    Crop: ${credit.crop} · NDVI: ${credit.ndvi} · Available: ${credit.co2} t CO₂<br>
    Price: ₹${credit.price}/tonne · Verra: ${credit.verra ? "✅ Verified" : "Pending"}
  `;

  updateBuySummary();
  modal.classList.remove("hidden");
}

function updateBuySummary() {
  if (!buyTarget) return;
  const qty = parseInt(document.getElementById("qtyInput")?.value || 10);
  const total = qty * buyTarget.price;
  const summary = document.getElementById("buySummary");
  if (summary) {
    summary.innerHTML = `
      <strong>${qty} t CO₂</strong> × ₹${buyTarget.price}/t = <strong style="color:#22c55e">₹${total.toLocaleString("en-IN")}</strong><br>
      <span style="font-size:0.78rem;color:#6b8fbf">Platform fee (3%): ₹${Math.round(total * 0.03).toLocaleString("en-IN")} · Net: ₹${Math.round(total * 0.97).toLocaleString("en-IN")}</span>
    `;
  }
}

function setupBuyModal() {
  document.getElementById("closeBuyModal")?.addEventListener("click", () => document.getElementById("buyModal").classList.add("hidden"));
  document.getElementById("qtyMinus")?.addEventListener("click", () => { const i = document.getElementById("qtyInput"); i.value = Math.max(1, parseInt(i.value) - 10); updateBuySummary(); });
  document.getElementById("qtyPlus")?.addEventListener("click",  () => { const i = document.getElementById("qtyInput"); i.value = parseInt(i.value) + 10; updateBuySummary(); });
  document.getElementById("qtyInput")?.addEventListener("input", updateBuySummary);
  document.getElementById("confirmBuyBtn")?.addEventListener("click", () => {
    const btn = document.getElementById("confirmBuyBtn");
    btn.textContent = "⏳ Processing…";
    btn.disabled = true;
    setTimeout(() => {
      document.getElementById("buyModal").classList.add("hidden");
      btn.textContent = "✅ Confirm Purchase";
      btn.disabled = false;
      buyTarget = null;
      showToast("✅ Purchase successful! Credits added to your portfolio.");
    }, 1800);
  });
}

function showToast(msg) {
  const t = document.createElement("div");
  t.style.cssText = "position:fixed;bottom:2rem;right:2rem;background:#0d1526;border:1px solid rgba(34,197,94,0.4);color:#4ade80;font-weight:700;font-size:0.85rem;padding:0.9rem 1.4rem;border-radius:12px;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.5);animation:fadein .3s ease";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ═══════════════════════════════════════════════════════════════════
// PORTFOLIO
// ═══════════════════════════════════════════════════════════════════
const PORTFOLIO = [
  { id:"HS-CR-00198", farmer:"Anandan K.",   region:"Kerala",      co2:120, ndvi:0.82, price:58440, vintage:"2024-25", status:"active",   purchased:"05 Apr 2025" },
  { id:"HS-CR-00195", farmer:"Lakshmi Bai",  region:"Tamil Nadu",  co2:85,  ndvi:0.76, price:40885, vintage:"2024-25", status:"active",   purchased:"04 Apr 2025" },
  { id:"HS-CR-00192", farmer:"Raghav S.",    region:"Andhra Pradesh", co2:200, ndvi:0.74, price:97000, vintage:"2024-25", status:"retired", purchased:"02 Apr 2025" },
  { id:"HS-CR-00184", farmer:"Meena Devi",   region:"Bihar",       co2:60,  ndvi:0.68, price:29280, vintage:"2023-24", status:"expiring", purchased:"30 Mar 2025" },
  { id:"HS-CR-00178", farmer:"Harpal Singh", region:"Punjab",      co2:180, ndvi:0.79, price:87300, vintage:"2024-25", status:"retired",  purchased:"25 Mar 2025" },
  { id:"HS-CR-00165", farmer:"Gopal K.",     region:"Tamil Nadu",  co2:510, ndvi:0.71, price:231030, vintage:"2024-25", status:"active",  purchased:"15 Mar 2025" },
  { id:"HS-CR-00154", farmer:"Fatima Bibi",  region:"Maharashtra", co2:140, ndvi:0.64, price:60900, vintage:"2023-24", status:"expiring", purchased:"10 Mar 2025" },
  { id:"HS-CR-00141", farmer:"Birsa Munda",  region:"Jharkhand",   co2:95,  ndvi:0.77, price:44460, vintage:"2024-25", status:"active",  purchased:"28 Feb 2025" },
];

function buildPortfolio() {
  const total   = PORTFOLIO.reduce((s,c) => s + c.co2, 0);
  const retired = PORTFOLIO.filter(c => c.status === "retired").reduce((s,c) => s + c.co2, 0);
  const avail   = PORTFOLIO.filter(c => c.status === "active").reduce((s,c) => s + c.co2, 0);
  const value   = PORTFOLIO.reduce((s,c) => s + c.price, 0);

  document.getElementById("pbTotal").textContent   = total + " t";
  document.getElementById("pbRetired").textContent = retired + " t";
  document.getElementById("pbAvail").textContent   = avail + " t";
  document.getElementById("pbValue").textContent   = "₹" + value.toLocaleString("en-IN");

  buildPortfolioTable();
  buildPortfolioSpendChart();
  buildPriceChart();

  document.getElementById("checkAll")?.addEventListener("change", (e) => {
    document.querySelectorAll(".c-row-check").forEach(cb => { cb.checked = e.target.checked; });
  });

  document.getElementById("retireSelectedBtn")?.addEventListener("click", () => {
    const checks = [...document.querySelectorAll(".c-row-check:checked")];
    if (!checks.length) { showToast("⚠️ Select credits to retire first."); return; }
    showToast(`✅ ${checks.length} credit(s) queued for retirement. Certificate generating…`);
    checks.forEach(c => c.checked = false);
  });
}

function buildPortfolioTable() {
  const body = document.getElementById("portfolioTableBody");
  if (!body) return;
  body.innerHTML = PORTFOLIO.map((c, i) => `
    <div class="c-portfolio-row">
      <span><input type="checkbox" class="c-row-check" data-idx="${i}" ${c.status === "retired" ? "disabled" : ""} /></span>
      <span style="font-family:monospace;font-size:0.72rem;color:#6b8fbf">${c.id}</span>
      <span>${c.farmer}</span>
      <span>${c.region}</span>
      <span style="font-weight:700;color:#e8f0ff">${c.co2} t</span>
      <span style="color:${c.ndvi >= 0.75 ? "#4ade80" : "#fbbf24"}">${c.ndvi}</span>
      <span style="color:#60a5fa">₹${c.price.toLocaleString("en-IN")}</span>
      <span>${c.vintage}</span>
      <span class="c-status-${c.status}">${
        c.status === "retired"  ? "✅ Retired" :
        c.status === "expiring" ? "⏳ Expiring" : "🔵 Active"
      }</span>
      <span>
        <button class="c-btn-retire" ${c.status === "retired" ? "disabled" : ""}>
          ${c.status === "retired" ? "Retired" : "Retire"}
        </button>
      </span>
    </div>
  `).join("");

  body.querySelectorAll(".c-btn-retire:not([disabled])").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      btn.textContent = "✅ Retired";
      btn.disabled = true;
      showToast("✅ Credit retired · ESG certificate generating…");
    });
  });
}

function buildPortfolioSpendChart() {
  const ctx = document.getElementById("portfolioSpendChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        data: SPEND_DATA,
        borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.08)",
        borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 3, pointBackgroundColor: "#3b82f6"
      }]
    },
    options: { ...CHART_OPT }
  });
}

function buildPriceChart() {
  const ctx = document.getElementById("priceChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        data: [420, 435, 448, 452, 460, 465, 472, 478, 483, 486, 489, 487],
        borderColor: "#a78bfa", backgroundColor: "rgba(167,139,250,0.06)",
        borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3
      }]
    },
    options: { ...CHART_OPT }
  });
}

// ═══════════════════════════════════════════════════════════════════
// ESG
// ═══════════════════════════════════════════════════════════════════
const FARMER_STORIES = [
  { emoji:"🧑‍🌾", name:"Anandan Krishnan",   loc:"Thrissur, Kerala",      co2:240, quote:"My coconut grove now earns me extra ₹12,000/month from carbon credits!" },
  { emoji:"👩‍🌾", name:"Lakshmi Bai",         loc:"Thanjavur, Tamil Nadu", co2:180, quote:"Harit Setu explained everything in Tamil. Simple process, real money." },
  { emoji:"🧑‍🌾", name:"Raghunath Reddy",     loc:"Guntur, Andhra Pradesh",co2:420, quote:"The IoT sensor cost just ₹10. My UPI gets credited every week." },
  { emoji:"👩‍🌾", name:"Meena Devi",          loc:"Patna, Bihar",          co2:60,  quote:"Never thought my small paddy field could fight climate change." },
  { emoji:"🧑‍🌾", name:"Harpal Singh",        loc:"Amritsar, Punjab",      co2:380, quote:"ISRO satellite verified my land — felt like being part of something big." },
  { emoji:"👩‍🌾", name:"Fatima Bibi",         loc:"Nanded, Maharashtra",   co2:140, quote:"Carbon income supplements my cotton income. Life is more stable now." },
];

function buildESG() {
  const grid = document.getElementById("farmerStoriesGrid");
  if (!grid) return;
  grid.innerHTML = FARMER_STORIES.map(f => `
    <div class="c-farmer-story">
      <div class="c-fs-avatar">${f.emoji}</div>
      <div class="c-fs-name">${f.name}</div>
      <div class="c-fs-loc">📍 ${f.loc}</div>
      <div class="c-fs-credit">🌿 ${f.co2} t CO₂ · Your company offset</div>
      <div class="c-fs-quote">"${f.quote}"</div>
    </div>
  `).join("");
}

// ═══════════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════════
const REAL_API_KEY = "hs_live_7a3c9f2e1b84d05e6a1291cc3849f2b8d7e4c0a1";
let apiRevealed = false;

function buildAPI() {
  buildApiUsageChart();

  document.getElementById("revealApiKey")?.addEventListener("click", () => {
    const el = document.getElementById("apiKeyDisplay");
    apiRevealed = !apiRevealed;
    el.textContent = apiRevealed ? REAL_API_KEY : "hs_live_●●●●●●●●●●●●●●●●●●●●●●●●";
    document.getElementById("revealApiKey").textContent = apiRevealed ? "🙈 Hide" : "👁 Reveal";
  });

  document.getElementById("copyApiKey")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(REAL_API_KEY);
    showToast("📋 API key copied to clipboard!");
  });

  document.getElementById("regenApiKey")?.addEventListener("click", () => {
    showToast("🔄 New API key generated · Old key invalidated");
    document.getElementById("apiKeyDisplay").textContent = "hs_live_●●●●●●●●●●●●●●●●●●●●●●●●";
    apiRevealed = false;
  });

  document.querySelector(".c-btn-save-webhook")?.addEventListener("click", () => {
    showToast("✅ Webhook saved · Test event dispatched");
  });
}

function buildApiUsageChart() {
  const ctx = document.getElementById("apiUsageChart");
  if (!ctx) return;
  const days = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
  const calls = Array.from({ length: 30 }, () => Math.floor(40 + Math.random() * 80));
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: days,
      datasets: [{ data: calls, backgroundColor: "rgba(59,130,246,0.4)", borderRadius: 3 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0d1526" } },
      scales: {
        x: { ticks: { color: "#2a3f5f", maxTicksLimit: 10 }, grid: { display: false } },
        y: { ticks: { color: "#2a3f5f" }, grid: { color: "rgba(255,255,255,0.03)" } }
      }
    }
  });
}

// ─── Global download simulation ───────────────────────────────────────────
window.simulateDownload = function(filename) {
  showToast(`📥 Generating ${filename}… Download will start shortly.`);
};

console.log("🏢 Harit Setu Company Portal initialized.");
