// ============================================
// Harit Setu – Firebase App with Auth
// Project: harit-setu-55e7a
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── Firebase Config ───────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCBrG7N9APcg0x58UuolZxTOMIcSgdoobA",
  authDomain: "harit-setu-55e7a.firebaseapp.com",
  projectId: "harit-setu-55e7a",
  storageBucket: "harit-setu-55e7a.firebasestorage.app",
  messagingSenderId: "679849739065",
  appId: "1:679849739065:web:0b12892c4c5c283def1ee8"
};

// ─── Initialize ────────────────────────────────────────────────────────────
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// ─── DOM References ────────────────────────────────────────────────────────
const authOverlay  = document.getElementById("authOverlay");
const closeAuth    = document.getElementById("closeAuth");
const authTitle    = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authError    = document.getElementById("authError");
const authSuccess  = document.getElementById("authSuccess");

const loginForm    = document.getElementById("loginForm");
const signupForm   = document.getElementById("signupForm");
const forgotForm   = document.getElementById("forgotForm");

const loginEmail   = document.getElementById("loginEmail");
const loginPassword= document.getElementById("loginPassword");
const signupName   = document.getElementById("signupName");
const signupEmail  = document.getElementById("signupEmail");
const signupPassword= document.getElementById("signupPassword");
const signupConfirm = document.getElementById("signupConfirm");
const forgotEmail  = document.getElementById("forgotEmail");

const navSignIn    = document.getElementById("navSignIn");
const footerSignIn = document.getElementById("footerSignIn");
const downloadAppBtn     = document.getElementById("downloadAppBtn");
const partnerMNCBtn      = document.getElementById("partnerMNCBtn");
const finalDownloadBtn   = document.getElementById("finalDownloadBtn");
const finalPartnerBtn    = document.getElementById("finalPartnerBtn");
const footerDownload     = document.getElementById("footerDownload");

// Toggle password visibility
function togglePw(input, btn) {
  if (input.type === "password") { input.type = "text"; btn.textContent = "Hide"; }
  else { input.type = "password"; btn.textContent = "Show"; }
}
document.getElementById("toggleLoginPw")?.addEventListener("click",  () => togglePw(loginPassword,  document.getElementById("toggleLoginPw")));
document.getElementById("toggleSignupPw")?.addEventListener("click", () => togglePw(signupPassword, document.getElementById("toggleSignupPw")));

// ─── Role Picker ───────────────────────────────────────────────────────────
let selectedRole = null; // "farmer" | "company"
const ROLE_KEY = "hs_user_role";

const rolePickerStep = document.getElementById("rolePickerStep");
const authStep       = document.getElementById("authStep");
const authRoleBadge  = document.getElementById("authRoleBadge");

function goToAuthStep(role) {
  selectedRole = role;
  localStorage.setItem(ROLE_KEY, role);

  rolePickerStep.classList.add("hidden");
  authStep.classList.remove("hidden");

  // Update badge
  authRoleBadge.textContent = role === "farmer" ? "🌾 Farmer Portal" : "🏢 Company Portal";
  authRoleBadge.className = `auth-role-badge ${role}`;

  switchMode("login");
}

function goToRolePicker() {
  authStep.classList.add("hidden");
  rolePickerStep.classList.remove("hidden");
  clearMessages();
}

document.getElementById("rolePickerFarmer")?.addEventListener("click", () => goToAuthStep("farmer"));
document.getElementById("rolePickerCompany")?.addEventListener("click", () => goToAuthStep("company"));
document.getElementById("backToRolePicker")?.addEventListener("click", goToRolePicker);

// Get the redirect URL based on role (absolute path from origin)
function getRedirectUrl() {
  const role = selectedRole || localStorage.getItem(ROLE_KEY);
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "/");
  return base + (role === "company" ? "company.html" : "dashboard.html");
}

// ─── Auth State ────────────────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    navSignIn.textContent = "Sign Out";
    navSignIn.style.background = "rgba(255,80,80,0.15)";
    navSignIn.style.borderColor = "rgba(255,80,80,0.3)";
    navSignIn.style.color = "#f87171";

    const role = localStorage.getItem(ROLE_KEY);

    // If already on index.html while signed in → redirect to their portal
    const isIndex = window.location.pathname.endsWith("/") ||
                    window.location.pathname.endsWith("index.html") ||
                    window.location.pathname === "";
    if (isIndex && !authOverlay.classList.contains("hidden") === false) {
      // Only auto-redirect if modal is NOT open (i.e. they didn't just click sign-in)
      // This prevents fighting with the sign-in flow redirect
    }

    const dashLink = document.getElementById("navDashboard");
    if (dashLink) {
      dashLink.style.display = "block";
      dashLink.textContent = role === "company" ? "🏢 Company Portal" : "🌾 My Dashboard";
      dashLink.href = getRedirectUrl();
    }
    hideAuthOverlay();
  } else {
    navSignIn.textContent = "Sign In";
    navSignIn.style.background = "";
    navSignIn.style.color = "";
    const dashLink = document.getElementById("navDashboard");
    if (dashLink) dashLink.style.display = "none";
  }
});

// ─── Show/Hide Modal ────────────────────────────────────────────────────────
function showAuthOverlay(mode = "login", role = null) {
  authOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  if (role) {
    // Skip role picker if role is pre-set (e.g. "Partner as MNC" button)
    goToAuthStep(role);
  } else {
    // Always start at role picker
    goToRolePicker();
  }
  clearMessages();
}

function hideAuthOverlay() {
  authOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function clearMessages() {
  showError("");
  showSuccessMsg("");
}

function showError(msg) {
  if (msg) {
    authError.textContent = msg;
    authError.classList.remove("hidden");
  } else {
    authError.textContent = "";
    authError.classList.add("hidden");
  }
}

function showSuccessMsg(msg) {
  if (msg) {
    authSuccess.textContent = msg;
    authSuccess.classList.remove("hidden");
  } else {
    authSuccess.textContent = "";
    authSuccess.classList.add("hidden");
  }
}

function switchMode(mode) {
  clearMessages();
  loginForm.classList.add("hidden");
  signupForm.classList.add("hidden");
  forgotForm.classList.add("hidden");

  const role = selectedRole || localStorage.getItem(ROLE_KEY) || "farmer";
  const isFarmer = role === "farmer";

  if (mode === "login") {
    loginForm.classList.remove("hidden");
    authTitle.textContent = "Welcome Back";
  } else if (mode === "signup") {
    signupForm.classList.remove("hidden");
    authTitle.textContent = "Create Account";
  } else if (mode === "forgot") {
    forgotForm.classList.remove("hidden");
    authTitle.textContent = "Reset Password";
  }
}

// ─── Event Listeners – Modal Triggers ──────────────────────────────────────
navSignIn?.addEventListener("click", (e) => {
  e.preventDefault();
  if (auth.currentUser) { signOut(auth); }
  else { showAuthOverlay(); }
});

// "Download Free App" → farmer role pre-selected
downloadAppBtn?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay("login", "farmer"); });
finalDownloadBtn?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay("login", "farmer"); });
footerDownload?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay("login", "farmer"); });

// "Partner as MNC" → company role pre-selected
partnerMNCBtn?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay("login", "company"); });
finalPartnerBtn?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay("login", "company"); });

// Footer Portal
footerSignIn?.addEventListener("click", (e) => { e.preventDefault(); showAuthOverlay(); });

closeAuth?.addEventListener("click", hideAuthOverlay);

authOverlay?.addEventListener("click", (e) => {
  if (e.target === authOverlay) hideAuthOverlay();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") hideAuthOverlay();
});

// Form switchers
document.getElementById("goToSignup")?.addEventListener("click", () => switchMode("signup"));
document.getElementById("goToLogin")?.addEventListener("click",  () => switchMode("login"));
document.getElementById("goToForgot")?.addEventListener("click", () => switchMode("forgot"));
document.getElementById("backToLogin")?.addEventListener("click",() => switchMode("login"));

// ─── Google Sign In ─────────────────────────────────────────────────────────
document.getElementById("googleSignInBtn")?.addEventListener("click", async () => {
  clearMessages();
  try {
    await signInWithPopup(auth, googleProvider);
    showSuccessMsg("✅ Signed in! Redirecting…");
    setTimeout(() => { window.location.href = getRedirectUrl(); }, 900);
  } catch (err) {
    showError(getFriendlyError(err.code));
  }
});

// ─── Login Form ─────────────────────────────────────────────────────────────
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();
  const btn = document.getElementById("loginSubmitBtn");
  btn.textContent = "Signing in…";
  btn.disabled = true;

  try {
    await signInWithEmailAndPassword(auth, loginEmail.value.trim(), loginPassword.value);
    showSuccessMsg("✅ Signed in! Redirecting…");
    setTimeout(() => { window.location.href = getRedirectUrl(); }, 800);
  } catch (err) {
    showError(getFriendlyError(err.code));
  } finally {
    btn.textContent = "Sign In";
    btn.disabled = false;
  }
});

// ─── Signup Form ─────────────────────────────────────────────────────────────
signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();

  if (signupPassword.value !== signupConfirm.value) { showError("Passwords do not match."); return; }
  if (signupPassword.value.length < 8) { showError("Password must be at least 8 characters."); return; }

  const btn = document.getElementById("signupSubmitBtn");
  btn.textContent = "Creating account…";
  btn.disabled = true;

  try {
    const cred = await createUserWithEmailAndPassword(auth, signupEmail.value.trim(), signupPassword.value);
    await updateProfile(cred.user, { displayName: signupName.value.trim() });
    showSuccessMsg("🎉 Welcome to Harit Setu! Taking you to your portal…");
    setTimeout(() => { window.location.href = getRedirectUrl(); }, 1200);
  } catch (err) {
    showError(getFriendlyError(err.code));
  } finally {
    btn.textContent = "Create Account";
    btn.disabled = false;
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
forgotForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessages();
  const btn = document.getElementById("forgotSubmitBtn");
  btn.textContent = "Sending…";
  btn.disabled = true;

  try {
    await sendPasswordResetEmail(auth, forgotEmail.value.trim());
    showSuccessMsg("📧 Reset link sent! Check your inbox.");
    forgotEmail.value = "";
  } catch (err) {
    showError(getFriendlyError(err.code));
  } finally {
    btn.textContent = "Send Reset Link";
    btn.disabled = false;
  }
});

// ─── Friendly Error Messages ──────────────────────────────────────────────────
function getFriendlyError(code) {
  const map = {
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password. Try again.",
    "auth/email-already-in-use":   "This email is already registered.",
    "auth/weak-password":          "Password is too weak. Use 8+ characters.",
    "auth/popup-closed-by-user":   "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/too-many-requests":      "Too many attempts. Please try later.",
    "auth/invalid-credential":     "Invalid credentials. Please check and retry.",
  };
  return map[code] || "An error occurred. Please try again.";
}

// ─── Navbar Scroll Effect ──────────────────────────────────────────────────────
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
}, { passive: true });

// ─── Mobile Hamburger ─────────────────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");

hamburger?.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

// Close nav when link clicked
navLinks?.querySelectorAll("a").forEach(a => {
  a.addEventListener("click", () => navLinks.classList.remove("open"));
});

// ─── Scroll Animation (IntersectionObserver) ──────────────────────────────────
const fadeEls = document.querySelectorAll(
  ".problem-card, .step-card, .market-stat-card, .revenue-card, .sdg-card, .team-card, .section-title, .section-subtitle"
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add("visible");
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });

fadeEls.forEach(el => {
  el.classList.add("fade-in-up");
  observer.observe(el);
});

// ─── Particle Animation ───────────────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  for (let i = 0; i < 25; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 1;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-delay: ${Math.random() * 8}s;
      animation-duration: ${Math.random() * 6 + 5}s;
      opacity: ${Math.random() * 0.5};
    `;
    container.appendChild(p);
  }
}

createParticles();

// ─── Smooth hash navigation ───────────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    const href = this.getAttribute("href");
    if (href === "#" || href === "") return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

console.log("🌿 Harit Setu – The Green Bridge | Carbon Revolution initialized.");
