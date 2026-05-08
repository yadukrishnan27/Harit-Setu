// ============================================
// Harit Setu – Farmer Dashboard JS
// Auth-guarded | Revenue | Satellite | Sensors
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// ─── AUTH GUARD ────────────────────────────────────────────────────────────
// Firebase briefly reports null before restoring the persisted session from
// IndexedDB. We use a one-shot listener and wait up to 4 seconds before
// treating the user as truly signed-out and redirecting.

let authInitialized = false;

const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
  authInitialized = true;
  unsubscribeAuth(); // one-shot: stop listening after first real resolution

  if (user) {
    initDashboard(user);
  } else {
    // Genuinely not signed in — go back to landing
    window.location.href = "index.html";
  }
});

// Safety timeout: if Firebase takes > 4 s to resolve (rare / offline),
// redirect rather than spinning forever
setTimeout(() => {
  if (!authInitialized) {
    window.location.href = "index.html";
  }
}, 4000);

// ─── SIGN OUT ──────────────────────────────────────────────────────────────
document.getElementById("signOutBtn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ─── INIT DASHBOARD ────────────────────────────────────────────────────────
function initDashboard(user) {
  // Hide loader, show app
  document.getElementById("authLoader").classList.add("hidden");
  document.getElementById("dashboardApp").classList.remove("hidden");

  // Set user info
  const firstName = user.displayName ? user.displayName.split(" ")[0] : "Farmer";
  document.getElementById("dashUserName").textContent = user.displayName || user.email;
  document.getElementById("welcomeName").textContent  = firstName;
  document.getElementById("dashAvatar").textContent   = firstName[0].toUpperCase();
  document.getElementById("greetingTime").textContent  = getGreeting();

  // Last updated
  updateTimestamp();
  setInterval(updateTimestamp, 60000);

  // Build all tab content
  buildOverview();
  buildRevenue();
  buildSatellite();
  buildSensors();

  // Tab navigation
  setupTabs();

  // Live sensor tick
  setInterval(tickSensorReadings, 8000);
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function updateTimestamp() {
  const now = new Date();
  document.getElementById("lastUpdatedTime").textContent =
    now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const sensorSync = document.getElementById("sensorLastSync");
  if (sensorSync) sensorSync.textContent = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── TAB SETUP ─────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      
      const content = document.getElementById(`tab-content-${tab}`);
      if (content) {
        content.classList.add("active");
        // Force charts to resize now that the container is visible
        window.dispatchEvent(new Event('resize'));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // "View All" links in overview jump to specific tabs
  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const tab = el.dataset.goto;
      
      // Update Buttons
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
      if (targetBtn) targetBtn.classList.add("active");

      // Update Content
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      const content = document.getElementById(`tab-content-${tab}`);
      if (content) {
        content.classList.add("active");
        window.dispatchEvent(new Event('resize'));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 1 – OVERVIEW
// ═══════════════════════════════════════════════════════════════════
function buildOverview() {
  // KPI values
  animateCounter("kpi-credits", 0, 18452, 1200, "₹", "");
  animateCounter("kpi-co2", 0, 1247, 1200, "", " kg");
  animateCounter("kpi-ndvi", 0, 74, 1200, "", "%");
  animateCounter("kpi-minted", 0, 32, 1200, "", "");

  // Mini charts
  buildOverviewEarningsChart();
  buildOverviewNdviChart();
  buildSensorMiniGrid();

  // Recent transactions
  buildRecentTransactions();
}

function animateCounter(id, from, to, duration, prefix, suffix) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(from + (to - from) * eased);
    el.textContent = prefix + val.toLocaleString("en-IN") + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0e1a0e", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 } },
  scales: {
    x: { ticks: { color: "#3a5a3a", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } },
    y: { ticks: { color: "#3a5a3a", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.04)" } }
  }
};

function buildOverviewEarningsChart() {
  const ctx = document.getElementById("overviewEarningsChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Oct","Nov","Dec","Jan","Feb","Mar","Apr"],
      datasets: [{
        data: [820, 960, 1100, 1250, 1400, 1680, 2100],
        borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.08)",
        borderWidth: 2, fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: "#22c55e"
      }]
    },
    options: { ...CHART_DEFAULTS, scales: { ...CHART_DEFAULTS.scales } }
  });
}

function buildOverviewNdviChart() {
  const ctx = document.getElementById("overviewNdviChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Mar"],
      datasets: [{
        data: [0.62, 0.60, 0.58, 0.55, 0.53, 0.68, 0.72, 0.75, 0.78, 0.74, 0.72, 0.69, 0.70, 0.74],
        borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.08)",
        borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0
      }]
    },
    options: { ...CHART_DEFAULTS }
  });
}

function buildSensorMiniGrid() {
  const grid = document.getElementById("sensorMiniGrid");
  if (!grid) return;
  const readings = [
    { label: "CO₂ Absorbed", value: "2.3 ppm" },
    { label: "Soil Carbon",  value: "4.8%" },
    { label: "Temp",         value: "29°C" },
    { label: "Humidity",     value: "72%" },
  ];
  grid.innerHTML = readings.map(r => `
    <div class="sensor-mini-item">
      <div class="smi-label">${r.label}</div>
      <div class="smi-value">${r.value}</div>
    </div>
  `).join("");
}

function buildRecentTransactions() {
  // Auto-generate 5 recent transactions anchored to the real current date
  const BUYERS = ["TataMotors ESG", "IndiGo Airlines", "HUL Offsets", "Open Market",
                  "Infosys Green", "Mahindra Sustain", "Bajaj Eco Credits", "ITC Green",
                  "BPCL Offsets", "Reliance ESG", "NTPC Carbon", "Vedanta Green"];
  const now = new Date();
  // seed based on year+month so the same month always shows the same transactions
  const seed = now.getFullYear() * 100 + now.getMonth();
  const seededRand = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

  const txs = Array.from({ length: 5 }, (_, i) => {
    const daysAgo = i === 0 ? Math.floor(seededRand(seed + i * 7) * 5) + 1
                             : Math.floor(seededRand(seed + i * 7) * 8) + (i * 2);
    const txDate = new Date(now);
    txDate.setDate(now.getDate() - daysAgo);
    const amount = Math.floor(seededRand(seed + i * 13) * 400) + 200;
    const buyerIdx = Math.floor(seededRand(seed + i * 17) * BUYERS.length);
    const idNum = 100 - i - (now.getFullYear() - 2024) * 12 - now.getMonth();
    return {
      date: txDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      id: `HS-CR-${String(Math.max(1, idNum)).padStart(5, "0")}`,
      buyer: BUYERS[buyerIdx],
      amount: "₹" + amount,
      status: i === 3 ? "pending" : "paid"
    };
  });

  const list = document.getElementById("recentTxList");
  if (!list) return;
  list.innerHTML = txs.map(t => `
    <div class="tx-row">
      <span>${t.date}</span>
      <span style="font-family:monospace;font-size:0.75rem;color:#7aab7a">${t.id}</span>
      <span>${t.buyer}</span>
      <span style="font-weight:700;color:#f0fdf4">${t.amount}</span>
      <span class="tx-status-${t.status}">${t.status === "paid" ? "✅ Paid" : "⏳ Pending"}</span>
    </div>
  `).join("");
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2 – REVENUE (Dynamic – auto-generates based on current date)
// ═══════════════════════════════════════════════════════════════════

/**
 * Generates 7 months of realistic monthly carbon credit data ending at the
 * current real month. The last entry is always marked as current.
 * Uses a deterministic seed so the same month always produces the same values.
 */
function generateMonthlyData() {
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun",
                       "Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const months = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth(); // 0-based
    // Deterministic seed: unique per year+month
    const seed = yr * 100 + mo;
    const sr = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

    // Base CO2 grows slightly month over month; seasonal variation (higher in summer)
    const seasonFactor = 1 + 0.15 * Math.sin((mo - 2) * Math.PI / 6);
    const baseCo2 = Math.round((40 + (6 - i) * 14 + sr(seed + 1) * 18) * seasonFactor);
    const minted  = Math.max(2, Math.round(baseCo2 / 24 + sr(seed + 2) * 1.5));
    const sold    = i === 0 ? Math.max(1, minted - 2) : minted; // current month may have unsold
    const pricePerCredit = 250 + Math.round(sr(seed + 3) * 150);
    const gross   = sold * pricePerCredit + Math.round(sr(seed + 4) * 200);
    const fee     = Math.round(gross * 0.03);
    const net     = gross - fee;

    months.push({
      month: `${MONTH_NAMES[mo]} ${yr}`,
      co2: baseCo2,
      minted,
      sold,
      gross,
      fee,
      net,
      current: i === 0
    });
  }
  return months;
}

const MONTHLY_DATA = generateMonthlyData();

function buildRevenue() {
  // Banner totals – all computed from dynamic data
  const lifetime = MONTHLY_DATA.reduce((s, m) => s + m.net, 0);
  const current  = MONTHLY_DATA.find(m => m.current);
  const prevMonth = MONTHLY_DATA[MONTHLY_DATA.length - 2];
  // Pending = current month credits minted but not yet sold × avg price
  const unsold = (current?.minted || 0) - (current?.sold || 0);
  const avgPrice = current ? Math.round(current.gross / Math.max(1, current.sold)) : 350;
  const pending = Math.max(0, unsold * avgPrice);

  document.getElementById("lifetimeEarnings").textContent = "₹" + lifetime.toLocaleString("en-IN");
  document.getElementById("monthEarnings").textContent    = "₹" + (current?.net || 0).toLocaleString("en-IN");
  document.getElementById("pendingEarnings").textContent  = "₹" + pending.toLocaleString("en-IN");

  // Update next payout date label: 7th of next month
  const nowD = new Date();
  const nextPayout = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 7);
  const nextPayoutEl = document.querySelector(".earn-big.small-text");
  if (nextPayoutEl) nextPayoutEl.textContent = nextPayout.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Update the month label in the banner subtitle dynamically
  const monthLabelEl = document.querySelector(".earn-stat:nth-child(2) .earn-label");
  if (monthLabelEl && current) monthLabelEl.textContent = `This Month (${current.month})`;

  // Monthly bar chart
  buildRevenueBarChart();

  // Monthly table
  buildMonthlyTable();

  // NFT cards
  buildCreditNFTs();
}

function buildRevenueBarChart() {
  const ctx = document.getElementById("revenueBarChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHLY_DATA.map(m => m.month.split(" ")[0]),
      datasets: [
        {
          label: "Net UPI Received (₹)",
          data: MONTHLY_DATA.map(m => m.net),
          backgroundColor: MONTHLY_DATA.map(m => m.current ? "rgba(34,197,94,0.9)" : "rgba(34,197,94,0.5)"),
          borderColor: "#22c55e", borderWidth: 1, borderRadius: 6,
        },
        {
          label: "Platform Fee (₹)",
          data: MONTHLY_DATA.map(m => m.fee),
          backgroundColor: "rgba(245,158,11,0.4)",
          borderColor: "#f59e0b", borderWidth: 1, borderRadius: 6,
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: "#7aab7a", font: { size: 11 } } },
        tooltip: { backgroundColor: "#0e1a0e", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }
      },
      scales: {
        x: { stacked: true, ticks: { color: "#3a5a3a" }, grid: { display: false } },
        y: { stacked: false, ticks: { color: "#3a5a3a", callback: v => "₹" + v }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });
}

function buildMonthlyTable() {
  const body = document.getElementById("monthlyTableBody");
  if (!body) return;
  body.innerHTML = MONTHLY_DATA.map(m => `
    <div class="monthly-row ${m.current ? 'current' : ''}">
      <span style="font-weight:${m.current ? '700' : '500'};color:${m.current ? '#f0fdf4' : '#7aab7a'}">${m.month} ${m.current ? '← Now' : ''}</span>
      <span>${m.co2} kg</span>
      <span>${m.minted}</span>
      <span>${m.sold}</span>
      <span>₹${m.gross.toLocaleString("en-IN")}</span>
      <span style="color:#f59e0b">-₹${m.fee}</span>
      <span style="font-weight:700;color:#22c55e">₹${m.net.toLocaleString("en-IN")}</span>
      <span class="${m.current ? 'pending' : 'paid'}">${m.current ? '⏳ In Progress' : '✅ Paid'}</span>
    </div>
  `).join("");
}

function buildCreditNFTs() {
  const grid = document.getElementById("creditNFTGrid");
  if (!grid) return;

  // Auto-generate NFT tokens from the last 2 months of MONTHLY_DATA
  const now = new Date();
  const nfts = [];
  const last2Months = MONTHLY_DATA.slice(-2);

  last2Months.forEach((m, mi) => {
    const [monName, yr] = m.month.split(" ");
    const MONTHS = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    const monthDate = new Date(parseInt(yr), MONTHS[monName], 1);
    const seed = parseInt(yr) * 100 + MONTHS[monName];
    const sr = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

    for (let i = 0; i < m.minted; i++) {
      const dayOffset = Math.floor(sr(seed + i * 11) * 26) + 1;
      const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.min(dayOffset, 28));
      const kg = +(sr(seed + i * 7) * 50 + 18).toFixed(1);
      // Current month unsold credits are listed/minted; past months are sold
      let status = "sold";
      if (mi === last2Months.length - 1) {
        // Current month
        status = i < m.sold ? (sr(seed + i * 3) > 0.5 ? "sold" : "listed") : "minted";
      }
      const hexChars = "0123456789abcdef";
      const randHex = (n, s) => Array.from({length:n}, (_,j) => hexChars[Math.floor(sr(s+j*3)*16)]).join("");
      nfts.push({
        id: `0x${randHex(4, seed+i)}...${randHex(4, seed+i+100)}`,
        kg,
        date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        status
      });
    }
  });

  // Sort newest first
  nfts.reverse();

  grid.innerHTML = nfts.map(n => `
    <div class="nft-card">
      <div class="nft-id">Token: ${n.id}</div>
      <div class="nft-amount">${n.kg} kg CO₂</div>
      <div class="nft-date">📅 ${n.date}</div>
      <span class="nft-status ${n.status}">${
        n.status === "sold"   ? "✅ SOLD" :
        n.status === "listed" ? "🔵 LISTED" : "🟣 MINTED"
      }</span>
    </div>
  `).join("");
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3 – SATELLITE
// ═══════════════════════════════════════════════════════════════════
function buildSatellite() {
  // Satellite status bar
  const now = new Date();
  document.getElementById("lastPassTime").textContent = formatTime(new Date(now - 3 * 3600000));
  document.getElementById("nextPassTime").textContent  = formatTime(new Date(now.getTime() + 21 * 3600000));
  document.getElementById("cloudCover").textContent   = "12%";

  // Animate vegetation counts
  setTimeout(() => {
    animateCounter("coconutCount", 0, 23, 1200, "", "");
    animateCounter("paddyArea",    0, 620, 1200, "", " m²");
    animateCounter("treeCount",    0, 41, 1200, "", "");
    animateCounter("biomassKg",    0, 2840, 1200, "", " kg");
  }, 300);

  // Draw the NDVI heatmap
  drawNdviMap();

  // NDVI history chart
  buildNdviHistoryChart();

  // Satellite pass log
  buildPassLog();
}

function formatTime(d) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ", " +
         d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function drawNdviMap() {
  const canvas = document.getElementById("ndviMapCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // Background (soil)
  ctx.fillStyle = "#1a0f00";
  ctx.fillRect(0, 0, W, H);

  // NDVI zones as irregular patches with gradient
  const zones = [
    { x: 80,  y: 60,  rx: 160, ry: 100, ndvi: 0.82, color: "#22c55e" }, // paddy - high
    { x: 380, y: 80,  rx: 100, ry: 80,  ndvi: 0.91, color: "#006600" }, // coconut - very high
    { x: 200, y: 220, rx: 120, ry: 70,  ndvi: 0.67, color: "#aacc00" }, // veg plot - moderate
    { x: 440, y: 220, rx: 70,  ry: 60,  ndvi: 0.55, color: "#f59e0b" }, // sparse - moderate
    { x: 80,  y: 260, rx: 50,  ry: 40,  ndvi: 0.08, color: "#7a3f00" }, // bare soil
  ];

  zones.forEach(z => {
    const grad = ctx.createRadialGradient(z.x, z.y, 0, z.x, z.y, Math.max(z.rx, z.ry));
    grad.addColorStop(0, z.color + "ee");
    grad.addColorStop(0.6, z.color + "88");
    grad.addColorStop(1, z.color + "11");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(z.x, z.y, z.rx, z.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Grid overlay
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // Farm boundary
  ctx.strokeStyle = "rgba(34,197,94,0.6)";
  ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.setLineDash([]);

  // Scale bar
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(W - 120, H - 30, 80, 3);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "11px Inter";
  ctx.fillText("50 m", W - 110, H - 15);

  // North indicator
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "bold 12px Inter";
  ctx.fillText("N↑", W - 25, 30);
}

function buildNdviHistoryChart() {
  const ctx = document.getElementById("ndviHistoryChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Apr'24","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan'25","Feb","Mar","Apr"],
      datasets: [
        {
          label: "NDVI Index",
          data: [0.58, 0.53, 0.70, 0.75, 0.78, 0.76, 0.74, 0.72, 0.69, 0.68, 0.72, 0.76, 0.74],
          borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.1)",
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4,
          pointBackgroundColor: "#22c55e", pointHoverRadius: 6
        },
        {
          label: "Threshold (Verra)",
          data: Array(13).fill(0.50),
          borderColor: "rgba(245,158,11,0.4)", borderDash: [5, 3],
          borderWidth: 1.5, fill: false, pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: "#7aab7a", font: { size: 11 } } },
        tooltip: { backgroundColor: "#0e1a0e", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }
      },
      scales: {
        x: { ticks: { color: "#3a5a3a" }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { min: 0.3, max: 1.0, ticks: { color: "#3a5a3a" }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });
}

function buildPassLog() {
  const log = document.getElementById("satellitePassLog");
  if (!log) return;
  const passes = [
    { time: "05 Apr 2025, 06:42", satellite: "ResourceSat-2A", ndvi: "0.74", quality: "Excellent", verra: "✅ Valid" },
    { time: "02 Apr 2025, 07:15", satellite: "ResourceSat-2A", ndvi: "0.72", quality: "Excellent", verra: "✅ Valid" },
    { time: "29 Mar 2025, 06:58", satellite: "Cartosat-3",    ndvi: "0.71", quality: "Good",      verra: "✅ Valid" },
    { time: "26 Mar 2025, 07:02", satellite: "ResourceSat-2A", ndvi: "0.70", quality: "Good",      verra: "✅ Valid" },
    { time: "23 Mar 2025, 14:20", satellite: "ResourceSat-2A", ndvi: "0.68", quality: "Partial",   verra: "⚠️ Review" },
  ];

  log.innerHTML = `
    <div class="pass-item pass-item-header">
      <span>Date & Time</span><span>Satellite</span><span>NDVI</span><span>Quality</span><span>Verra</span>
    </div>
    ${passes.map(p => `
      <div class="pass-item">
        <span>${p.time}</span>
        <span style="font-size:0.78rem">${p.satellite}</span>
        <span style="font-weight:700;color:#22c55e">${p.ndvi}</span>
        <span><span class="pass-quality quality-${p.quality.toLowerCase()}">${p.quality}</span></span>
        <span>${p.verra}</span>
      </div>
    `).join("")}
  `;
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4 – SENSORS
// ═══════════════════════════════════════════════════════════════════

// Sensor state - simulates live IoT device data
let sensorState = [
  {
    id: "CS-001", name: "Paddy Field North",
    status: "online", battery: 87,
    co2_ppm: 2.3, temp: 29.4, humidity: 74, soil_carbon: 4.8, moisture: 65,
    lat: "10.2343", lng: "76.8910"
  },
  {
    id: "CS-002", name: "Paddy Field South",
    status: "online", battery: 92,
    co2_ppm: 1.9, temp: 30.1, humidity: 71, soil_carbon: 4.5, moisture: 61,
    lat: "10.2341", lng: "76.8915"
  },
  {
    id: "CS-003", name: "Coconut Grove",
    status: "online", battery: 65,
    co2_ppm: 3.8, temp: 28.7, humidity: 79, soil_carbon: 5.9, moisture: 72,
    lat: "10.2347", lng: "76.8920"
  },
  {
    id: "CS-004", name: "Vegetable Plot",
    status: "warning", battery: 21,
    co2_ppm: 1.4, temp: 31.2, humidity: 66, soil_carbon: 3.9, moisture: 54,
    lat: "10.2350", lng: "76.8908"
  }
];

function buildSensors() {
  renderSensorCards();
  buildCo2TrendChart();
  buildSoilCarbonChart();
  buildSoilMoistureChart();
  buildSensorEventLog();

  document.getElementById("refreshSensors")?.addEventListener("click", () => {
    tickSensorReadings(true);
  });
}

function renderSensorCards() {
  const grid = document.getElementById("sensorCardsGrid");
  if (!grid) return;

  if (grid.children.length === 0) {
    grid.innerHTML = sensorState.map(s => {
      const co2Color  = s.co2_ppm > 3 ? "#22c55e" : s.co2_ppm > 1.5 ? "#f59e0b" : "#60a5fa";
      const tempColor = s.temp < 30 ? "#22c55e" : "#f59e0b";
      const batColor  = s.battery > 60 ? "#22c55e" : s.battery > 30 ? "#f59e0b" : "#f87171";
      const batEmoji  = s.battery > 60 ? "🔋" : s.battery > 30 ? "🔋" : "🔌";
      const co2Pct = Math.min((s.co2_ppm / 5) * 100, 100);
      const tmpPct = Math.min(((s.temp - 20) / 20) * 100, 100);
      const humPct = s.humidity;
      const scPct  = Math.min((s.soil_carbon / 10) * 100, 100);

      return `
        <div class="sensor-card" id="sensor-card-${s.id}">
          <div class="sensor-card-header">
            <div>
              <div class="sensor-name">${s.name}</div>
              <div class="sensor-id">${s.id} · ${s.lat}°N, ${s.lng}°E</div>
            </div>
            <span class="sensor-status-badge ${s.status}">${s.status === "online" ? "Online" : "⚠ Low Battery"}</span>
          </div>
          <div class="sensor-readings">
            <div class="s-reading-item">
              <div class="s-reading-label">CO₂ Absorption</div>
              <div class="s-reading-value" style="color:${co2Color}">${s.co2_ppm} <span class="s-reading-unit">ppm/hr</span></div>
              <div class="s-reading-bar"><div class="s-reading-fill" style="width:${co2Pct}%;background:${co2Color}"></div></div>
            </div>
            <div class="s-reading-item">
              <div class="s-reading-label">Temperature</div>
              <div class="s-reading-value" style="color:${tempColor}">${s.temp}°C</div>
              <div class="s-reading-bar"><div class="s-reading-fill" style="width:${tmpPct}%;background:${tempColor}"></div></div>
            </div>
            <div class="s-reading-item">
              <div class="s-reading-label">Humidity</div>
              <div class="s-reading-value" style="color:#60a5fa">${s.humidity}%</div>
              <div class="s-reading-bar"><div class="s-reading-fill" style="width:${humPct}%;background:#60a5fa"></div></div>
            </div>
            <div class="s-reading-item">
              <div class="s-reading-label">Soil Carbon</div>
              <div class="s-reading-value" style="color:#22c55e">${s.soil_carbon}%</div>
              <div class="s-reading-bar"><div class="s-reading-fill" style="width:${scPct}%;background:#22c55e"></div></div>
            </div>
          </div>
          <div class="sensor-battery">
            <span class="battery-icon">${batEmoji}</span>
            <span style="color:${batColor};font-weight:700">${s.battery}%</span>
            <span>battery</span>
            ${s.battery < 30 ? '<span style="color:#f87171;font-weight:700;margin-left:.3rem">– Replace Soon</span>' : ''}
          </div>
        </div>
      `;
    }).join("");
    return;
  }

  // Update existing cards to prevent scroll jump (Targeted DOM updates)
  sensorState.forEach(s => {
    const card = document.getElementById(`sensor-card-${s.id}`);
    if (!card) return;
    
    const co2Color  = s.co2_ppm > 3 ? "#22c55e" : s.co2_ppm > 1.5 ? "#f59e0b" : "#60a5fa";
    const tempColor = s.temp < 30 ? "#22c55e" : "#f59e0b";
    const batColor  = s.battery > 60 ? "#22c55e" : s.battery > 30 ? "#f59e0b" : "#f87171";
    const batEmoji  = s.battery > 60 ? "🔋" : s.battery > 30 ? "🔋" : "🔌";
    const co2Pct = Math.min((s.co2_ppm / 5) * 100, 100);
    const tmpPct = Math.min(((s.temp - 20) / 20) * 100, 100);
    const humPct = s.humidity;
    const scPct  = Math.min((s.soil_carbon / 10) * 100, 100);

    // Header
    card.querySelector(".sensor-name").textContent = s.name;
    card.querySelector(".sensor-id").textContent = `${s.id} · ${s.lat}°N, ${s.lng}°E`;
    const statusBadge = card.querySelector(".sensor-status-badge");
    statusBadge.className = `sensor-status-badge ${s.status}`;
    statusBadge.textContent = s.status === "online" ? "Online" : "⚠ Low Battery";

    // Readings
    const readingItems = card.querySelectorAll(".s-reading-item");
    if (readingItems.length === 4) {
      // CO2
      const co2Val = readingItems[0].querySelector(".s-reading-value");
      co2Val.style.color = co2Color;
      co2Val.innerHTML = `${s.co2_ppm} <span class="s-reading-unit">ppm/hr</span>`;
      const co2Fill = readingItems[0].querySelector(".s-reading-fill");
      co2Fill.style.width = `${co2Pct}%`;
      co2Fill.style.background = co2Color;

      // Temp
      const tempVal = readingItems[1].querySelector(".s-reading-value");
      tempVal.style.color = tempColor;
      tempVal.textContent = `${s.temp}°C`;
      const tempFill = readingItems[1].querySelector(".s-reading-fill");
      tempFill.style.width = `${tmpPct}%`;
      tempFill.style.background = tempColor;

      // Humidity
      const humVal = readingItems[2].querySelector(".s-reading-value");
      humVal.textContent = `${s.humidity}%`;
      const humFill = readingItems[2].querySelector(".s-reading-fill");
      humFill.style.width = `${humPct}%`;

      // Soil Carbon
      const scVal = readingItems[3].querySelector(".s-reading-value");
      scVal.textContent = `${s.soil_carbon}%`;
      const scFill = readingItems[3].querySelector(".s-reading-fill");
      scFill.style.width = `${scPct}%`;
    }

    // Battery
    const batteryDiv = card.querySelector(".sensor-battery");
    batteryDiv.innerHTML = `
      <span class="battery-icon">${batEmoji}</span>
      <span style="color:${batColor};font-weight:700">${s.battery}%</span>
      <span>battery</span>
      ${s.battery < 30 ? '<span style="color:#f87171;font-weight:700;margin-left:.3rem">– Replace Soon</span>' : ''}
    `;
  });
}

// Tick – simulate sensor value changes
function tickSensorReadings(manual = false) {
  const btn = document.getElementById("refreshSensors");

  sensorState = sensorState.map(s => ({
    ...s,
    co2_ppm:     +(s.co2_ppm  + (Math.random() - 0.4) * 0.3).toFixed(2),
    temp:        +(s.temp     + (Math.random() - 0.5) * 0.4).toFixed(1),
    humidity:    Math.min(100, Math.max(40, s.humidity + Math.round((Math.random() - 0.5) * 2))),
    soil_carbon: +(s.soil_carbon + (Math.random() - 0.45) * 0.05).toFixed(2),
    moisture:    Math.min(100, Math.max(30, s.moisture + Math.round((Math.random() - 0.5) * 3))),
    battery:     Math.max(0, s.battery - (Math.random() < 0.3 ? 1 : 0)),
  }));

  renderSensorCards();
  updateTimestamp();

  if (manual && btn) {
    btn.textContent = "✓ Updated";
    btn.style.color = "#22c55e";
    setTimeout(() => { btn.textContent = "⟳ Refresh Now"; btn.style.color = ""; }, 1500);
  }
}

function buildCo2TrendChart() {
  const ctx = document.getElementById("co2TrendChart");
  if (!ctx) return;

  // 24-hour hourly data
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,"0")}:00`);
  const co2Values = [
    1.1, 0.9, 0.8, 0.7, 0.8, 1.2, 1.8, 2.4, 2.9, 3.1, 3.3, 3.4,
    3.2, 3.0, 2.8, 2.6, 2.5, 2.3, 2.1, 2.0, 1.8, 1.6, 1.3, 1.1
  ];

  new Chart(ctx, {
    type: "line",
    data: {
      labels: hours,
      datasets: [
        {
          label: "CO₂ Absorption (avg ppm/hr)",
          data: co2Values,
          borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.12)",
          borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 0
        },
        {
          label: "Baseline",
          data: Array(24).fill(1.0),
          borderColor: "rgba(96,165,250,0.4)", borderDash: [4, 3],
          borderWidth: 1.5, fill: false, pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: "#7aab7a", font: { size: 11 } } },
        tooltip: { backgroundColor: "#0e1a0e", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }
      },
      scales: {
        x: { ticks: { color: "#3a5a3a", maxTicksLimit: 12 }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { ticks: { color: "#3a5a3a" }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });
}

function buildSoilCarbonChart() {
  const ctx = document.getElementById("soilCarbonChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Oct","Nov","Dec","Jan","Feb","Mar","Apr"],
      datasets: [
        { label: "Paddy N",   data: [3.8, 3.9, 4.1, 4.3, 4.5, 4.7, 4.8], borderColor: "#22c55e", borderWidth: 2, tension: 0.4, pointRadius: 3 },
        { label: "Paddy S",   data: [3.5, 3.6, 3.8, 3.9, 4.1, 4.3, 4.5], borderColor: "#60a5fa", borderWidth: 2, tension: 0.4, pointRadius: 3 },
        { label: "Coconut",   data: [4.5, 4.7, 4.9, 5.2, 5.5, 5.7, 5.9], borderColor: "#f59e0b", borderWidth: 2, tension: 0.4, pointRadius: 3 },
        { label: "Vegetable", data: [3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 3.9], borderColor: "#a78bfa", borderWidth: 2, tension: 0.4, pointRadius: 3 },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: "#7aab7a", font: { size: 10 } } }, tooltip: { backgroundColor: "#0e1a0e" } },
      scales: {
        x: { ticks: { color: "#3a5a3a" }, grid: { color: "rgba(255,255,255,0.04)" } },
        y: { ticks: { color: "#3a5a3a", callback: v => v + "%" }, grid: { color: "rgba(255,255,255,0.04)" } }
      }
    }
  });
}

function buildSoilMoistureChart() {
  const ctx = document.getElementById("soilMoistureChart");
  if (!ctx) return;
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Paddy North", "Paddy South", "Coconut Grove", "Veg Plot"],
      datasets: [{
        label: "Soil Moisture %",
        data: [65, 61, 72, 54],
        backgroundColor: ["rgba(34,197,94,0.7)", "rgba(34,197,94,0.5)", "rgba(22,163,74,0.7)", "rgba(245,158,11,0.5)"],
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0e1a0e" } },
      scales: {
        x: { ticks: { color: "#3a5a3a", font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: "#3a5a3a", callback: v => v + "%" }, grid: { color: "rgba(255,255,255,0.04)" }, max: 100 }
      }
    }
  });
}

function buildSensorEventLog() {
  const logEl = document.getElementById("sensorEventLog");
  if (!logEl) return;
  const now = Date.now();
  const events = [
    { time: new Date(now - 2 * 60000),    sensor: "CS-001", event: "CO₂ reading: 2.3 ppm/hr — Normal", level: "ok" },
    { time: new Date(now - 5 * 60000),    sensor: "CS-003", event: "Soil carbon updated: 5.9%", level: "info" },
    { time: new Date(now - 8 * 60000),    sensor: "CS-004", event: "Battery low: 21% — Replace recommended", level: "warn" },
    { time: new Date(now - 12 * 60000),   sensor: "CS-002", event: "Humidity spike: 78% → Normal", level: "info" },
    { time: new Date(now - 20 * 60000),   sensor: "CS-001", event: "Data sent to blockchain gateway", level: "ok" },
    { time: new Date(now - 35 * 60000),   sensor: "CS-003", event: "Peak CO₂ absorption: 4.1 ppm/hr at 13:00", level: "ok" },
    { time: new Date(now - 45 * 60000),   sensor: "CS-002", event: "ISRO satellite pass — Data captured", level: "info" },
    { time: new Date(now - 60 * 60000),   sensor: "CS-001", event: "Daily report sent to Harit Setu gateway", level: "ok" },
    { time: new Date(now - 90 * 60000),   sensor: "CS-004", event: "Temperature: 31.5°C — Slightly elevated", level: "warn" },
    { time: new Date(now - 120 * 60000),  sensor: "CS-003", event: "Soil moisture: 72% — Optimal", level: "ok" },
  ];

  logEl.innerHTML = `
    <div class="log-item log-item-header">
      <span>Time</span><span>Sensor</span><span>Event</span><span>Level</span>
    </div>
    ${events.map(e => `
      <div class="log-item">
        <span style="font-family:monospace;font-size:0.75rem">${e.time.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}</span>
        <span style="font-weight:600;color:#7aab7a">${e.sensor}</span>
        <span>${e.event}</span>
        <span class="log-level-${e.level}">${e.level.toUpperCase()}</span>
      </div>
    `).join("")}
  `;
}

console.log("🌿 Harit Setu Farmer Dashboard initialized.");
