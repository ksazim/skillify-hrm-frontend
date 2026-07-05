<template>
  <div class="admin-login">
    <!-- Left panel — decorative -->
    <div class="login-left">
      <div class="left-glow left-glow--top" />
      <div class="left-glow left-glow--mid" />
      <div class="left-glow left-glow--bottom" />

      <!-- Grid lines -->
      <div class="grid-lines">
        <span v-for="n in 6" :key="n" class="grid-line grid-line--v" :style="{ left: n * 16.66 + '%' }" />
        <span v-for="n in 5" :key="n" class="grid-line grid-line--h" :style="{ top: n * 20 + '%' }" />
      </div>

      <!-- Brand -->
      <div class="left-brand">
        <div class="brand-mark">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">{{
            systemData?.brand_name || "Nexara"
          }}</span>
          <span class="brand-sub">Human Resources</span>
        </div>
      </div>

      <!-- Central quote -->
      <div class="left-quote">
        <div class="quote-rule" />
        <p class="quote-text">
          Precision in people,<br />excellence in operations.
        </p>
        <p class="quote-sub">Secure access for authorized staff only</p>
      </div>

      <!-- Bottom stats -->
      <div class="left-stats">
        <div class="stat">
          <span class="stat-value">99.9%</span>
          <span class="stat-label">Uptime</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-value">256-bit</span>
          <span class="stat-label">Encryption</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-value">ISO 27001</span>
          <span class="stat-label">Certified</span>
        </div>
      </div>
    </div>

    <!-- Right panel — form -->
    <div class="login-right">
      <div class="right-glow" />

      <div class="login-box">
        <!-- Header -->
        <div class="login-header">
          <div class="logo-wrap" v-if="systemData?.logo">
            <img :src="getLogoUrl(systemData.logo)" :alt="systemData.brand_name" class="brand-logo" />
          </div>
          <div class="logo-mark-sm" v-else>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
            </svg>
          </div>
          <h1 class="login-title">Welcome back</h1>
          <p class="login-sub">Sign in to your account to continue</p>
        </div>

        <!-- Alerts -->
        <Transition name="alert">
          <div v-if="errorMessage" class="alert alert--error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <Transition name="alert">
          <div v-if="successMessage" class="alert alert--success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </Transition>

        <!-- Form -->
        <form @submit.prevent="login" class="login-form" novalidate>
          <div class="field-group" :class="{ 'field-group--error': fieldErrors.email }">
            <label class="field-label">Email address</label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <input type="email" v-model="form.email" placeholder="admin@domain.com" required :disabled="loading"
                autocomplete="email" @blur="validateEmail" />
            </div>
            <span v-if="fieldErrors.email" class="field-error">{{
              fieldErrors.email
            }}</span>
          </div>

          <div class="field-group" :class="{ 'field-group--error': fieldErrors.password }">
            <label class="field-label">Password</label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd" />
              </svg>
              <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="••••••••" required
                :disabled="loading" autocomplete="current-password" @blur="validatePassword" />
              <button type="button" class="toggle-pw" @click="showPassword = !showPassword" :disabled="loading">
                <!-- Eye open -->
                <svg v-if="!showPassword" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd" />
                </svg>
                <!-- Eye closed -->
                <svg v-else viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clip-rule="evenodd" />
                  <path
                    d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              </button>
            </div>
            <span v-if="fieldErrors.password" class="field-error">{{
              fieldErrors.password
            }}</span>
          </div>

          <div class="form-options">
            <label class="remember-label">
              <input type="checkbox" v-model="form.remember" class="remember-check" />
              <span class="remember-custom" />
              <span>Remember me</span>
            </label>
          </div>

          <button class="submit-btn" type="submit" :disabled="loading" :class="{ loading }">
            <Transition name="btn-text" mode="out-in">
              <span v-if="!loading" key="idle" class="btn-idle">
                Sign In
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M3 10a1 1 0 011-1h10.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H4a1 1 0 01-1-1z"
                    clip-rule="evenodd" />
                </svg>
              </span>
              <span v-else key="busy" class="btn-busy">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                    stroke-opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
                </svg>
                Signing in…
              </span>
            </Transition>
          </button>
        </form>

        <!-- Footer -->
        <div class="login-footer">
          <router-link to="/" class="back-link">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd" />
            </svg>
            Back to website
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/store/auth";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const systemData = ref(null);
const showPassword = ref(false);

const form = reactive({
  email: "",
  password: "",
  remember: false,
});

const fieldErrors = reactive({
  email: "",
  password: "",
});

// ── Validation ─────────────────────────────────────────────────────────────────
function validateEmail() {
  if (!form.email) {
    fieldErrors.email = "Email is required";
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = "Enter a valid email address";
    return false;
  }
  fieldErrors.email = "";
  return true;
}

function validatePassword() {
  if (!form.password) {
    fieldErrors.password = "Password is required";
    return false;
  }
  fieldErrors.password = "";
  return true;
}

// ── API ────────────────────────────────────────────────────────────────────────
const fetchSystemSettings = async () => {
  try {
    // Mock system data for offline mode
    systemData.value = {
      brand_name: "Nexara",
      logo: null,
      favicon: null,
      primary_color: "#4f46e5",
      secondary_color: "#10b981",
    };
  } catch (error) {
    console.error("Error fetching system settings:", error);
  }
};

const getLogoUrl = (path) =>
  path ? `${process.env.VUE_APP_BASE_URL}/${path}` : "";

const login = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const emailOk = validateEmail();
  const passwordOk = validatePassword();
  if (!emailOk || !passwordOk) return;

  loading.value = true;

  try {
    const response = await fetch(
      `${process.env.VUE_APP_BASE_API}/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      }
    );

    const data = await response.json();

    if (data.status === 200) {
      authStore.login(data.token);
      successMessage.value = "Login successful! Redirecting…";
      setTimeout(() => router.push("/admin/dashboard"), 1000);
    } else if (data.status === 401) {
      errorMessage.value = "Invalid email or password. Please try again.";
    } else if (data.status === 422) {
      errorMessage.value = data.errors
        ? Object.values(data.errors).flat().join(", ")
        : data.message || "Validation failed.";
    } else {
      errorMessage.value = data.message || "Login failed. Please try again.";
    }
  } catch (error) {
    console.error('Full error:', error);
    errorMessage.value = "Unable to connect to server. Please check your connection.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSystemSettings();
  if (authStore.isAuthenticated) router.push("/admin/dashboard");
});
</script>

<style scoped>
/* ── Design tokens (matches sidebar) ── */
.admin-login {
  --primary: #4338ca;
  --primary-hover: #3730a3;
  --primary-soft: #eef2ff;
  --primary-soft-strong: #e0e7ff;

  --bg: #ffffff;
  --bg-soft: #f9fafb;
  --bg-panel-a: #f5f6ff;
  --bg-panel-b: #ffffff;

  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;

  --border: #e5e7eb;
  --border-strong: #d1d5db;
  --border-focus: #a5b4fc;

  --success: #059669;
  --success-bg: #ecfdf5;
  --success-border: #a7f3d0;
  --error: #dc2626;
  --error-bg: #fef2f2;
  --error-border: #fecaca;

  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 8px 20px -6px rgba(15, 23, 42, 0.10);
  --shadow-lg: 0 24px 48px -16px rgba(15, 23, 42, 0.16);
}

/* ── Shell ── */
.admin-login {
  min-height: 100vh;
  width: 100%;
  display: flex;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
}

/* ══════════════════════════════════════
   LEFT PANEL
══════════════════════════════════════ */
.login-left {
  position: relative;
  width: 42%;
  background: linear-gradient(165deg, var(--bg-panel-a) 0%, var(--bg-panel-b) 65%);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 52px;
  overflow: hidden;
  flex-shrink: 0;
}

/* Glows */
.left-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.left-glow--top {
  top: -120px;
  left: -80px;
  width: 360px;
  height: 360px;
  background: radial-gradient(circle,
      rgba(67, 56, 202, 0.10) 0%,
      transparent 65%);
}

.left-glow--mid {
  top: 40%;
  left: 30%;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle,
      rgba(67, 56, 202, 0.06) 0%,
      transparent 70%);
}

.left-glow--bottom {
  bottom: -80px;
  right: -60px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle,
      rgba(67, 56, 202, 0.08) 0%,
      transparent 65%);
}

/* Grid lines */
.grid-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
}

.grid-line--v {
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom,
      transparent,
      rgba(67, 56, 202, 0.07) 30%,
      rgba(67, 56, 202, 0.07) 70%,
      transparent);
}

.grid-line--h {
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right,
      transparent,
      rgba(67, 56, 202, 0.07) 30%,
      rgba(67, 56, 202, 0.07) 70%,
      transparent);
}

/* Brand */
.left-brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #ffffff;
  background: var(--primary);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.brand-mark svg {
  width: 19px;
  height: 19px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1;
}

.brand-sub {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--primary);
  line-height: 1;
}

/* Quote */
.left-quote {
  position: relative;
  z-index: 1;
}

.quote-rule {
  width: 32px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(to right, var(--primary), var(--border-focus));
  margin-bottom: 22px;
}

.quote-text {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0 0 14px;
}

.quote-sub {
  font-size: 12.5px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  margin: 0;
}

/* Stats */
.left-stats {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 17px;
  font-weight: 700;
  color: var(--primary);
  letter-spacing: -0.01em;
}

.stat-label {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--border);
}

/* ══════════════════════════════════════
   RIGHT PANEL
══════════════════════════════════════ */
.login-right {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  position: relative;
  background: var(--bg);
  overflow: hidden;
}

.right-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle,
      rgba(67, 56, 202, 0.05) 0%,
      transparent 65%);
  pointer-events: none;
}

.login-box {
  width: 100%;
  max-width: 408px;
  position: relative;
  z-index: 1;
}

/* ── Header ── */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-wrap {
  display: inline-block;
  margin-bottom: 20px;
}

.brand-logo {
  width: 68px;
  height: 68px;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.logo-mark-sm {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #ffffff;
  background: var(--primary);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.logo-mark-sm svg {
  width: 21px;
  height: 21px;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  margin: 0 0 6px;
}

.login-sub {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 0.005em;
  margin: 0;
}

/* ── Alerts ── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: 13px;
  letter-spacing: 0.005em;
  line-height: 1.5;
}

.alert svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert--error {
  background: var(--error-bg);
  border-color: var(--error-border);
  color: #b91c1c;
}

.alert--success {
  background: var(--success-bg);
  border-color: var(--success-border);
  color: #047857;
}

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field-group {
  margin-bottom: 18px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--text-secondary);
  margin-bottom: 7px;
}

.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 14px;
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

.field-wrap input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13.5px;
  font-family: inherit;
  letter-spacing: 0.002em;
  outline: none;
  transition: border-color 0.15s, background-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.field-wrap input::placeholder {
  color: var(--text-muted);
}

.field-wrap input:focus {
  border-color: var(--primary);
  background: var(--bg);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.field-wrap input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toggle-pw {
  position: absolute;
  right: 10px;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background-color 0.15s;
  padding: 0;
}

.toggle-pw:hover {
  color: var(--primary);
  background: var(--primary-soft);
}

.toggle-pw svg {
  width: 15px;
  height: 15px;
}

.toggle-pw:disabled {
  pointer-events: none;
}

/* Error states */
.field-group--error .field-wrap input {
  border-color: var(--error-border);
  background: var(--error-bg);
}

.field-group--error .field-wrap input:focus {
  border-color: var(--error);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.field-error {
  display: block;
  font-size: 11.5px;
  color: var(--error);
  margin-top: 5px;
  letter-spacing: 0.005em;
}

/* ── Form options ── */
.form-options {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  letter-spacing: 0.005em;
}

.remember-check {
  display: none;
}

.remember-custom {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border-strong);
  border-radius: 5px;
  background: var(--bg);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.15s, background-color 0.15s;
}

.remember-check:checked+.remember-custom {
  background: var(--primary);
  border-color: var(--primary);
}

.remember-check:checked+.remember-custom::after {
  content: "";
  position: absolute;
  left: 4.5px;
  top: 1.5px;
  width: 4px;
  height: 8px;
  border-right: 1.5px solid #ffffff;
  border-bottom: 1.5px solid #ffffff;
  transform: rotate(45deg);
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: 13px 20px;
  background: var(--primary);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background-color 0.15s, transform 0.15s, box-shadow 0.15s;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-idle,
.btn-busy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
}

.btn-idle svg {
  width: 16px;
  height: 16px;
}

.btn-busy {
  gap: 10px;
}

.spinner {
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Footer ── */
.login-footer {
  margin-top: 26px;
  text-align: center;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  letter-spacing: 0.01em;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}

.back-link:hover {
  color: var(--primary);
}

.back-link svg {
  width: 13px;
  height: 13px;
}

/* ── Transitions ── */
.alert-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.alert-leave-active {
  transition: opacity 0.15s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.alert-leave-to {
  opacity: 0;
}

.btn-text-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.btn-text-leave-active {
  transition: opacity 0.1s ease;
}

.btn-text-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.btn-text-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .login-left {
    display: none;
  }

  .login-right {
    background: var(--bg);
  }
}

@media (max-width: 480px) {
  .login-right {
    padding: 32px 20px;
  }

  .login-title {
    font-size: 21px;
  }

  .quote-text {
    font-size: 26px;
  }
}
</style>