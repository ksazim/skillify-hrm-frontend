<template>
  <div class="admin-login">
    <!-- Left panel — decorative -->
    <div class="login-left">
      <div class="left-glow left-glow--top" />
      <div class="left-glow left-glow--mid" />
      <div class="left-glow left-glow--bottom" />

      <!-- Grid lines -->
      <div class="grid-lines">
        <span
          v-for="n in 6"
          :key="n"
          class="grid-line grid-line--v"
          :style="{ left: n * 16.66 + '%' }"
        />
        <span
          v-for="n in 5"
          :key="n"
          class="grid-line grid-line--h"
          :style="{ top: n * 20 + '%' }"
        />
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
            <img
              :src="getLogoUrl(systemData.logo)"
              :alt="systemData.brand_name"
              class="brand-logo"
            />
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </Transition>

        <Transition name="alert">
          <div v-if="successMessage" class="alert alert--success">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{{ successMessage }}</span>
          </div>
        </Transition>

        <!-- Form -->
        <form @submit.prevent="login" class="login-form" novalidate>
          <div
            class="field-group"
            :class="{ 'field-group--error': fieldErrors.email }"
          >
            <label class="field-label">Email address</label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"
                />
                <path
                  d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"
                />
              </svg>
              <input
                type="email"
                v-model="form.email"
                placeholder="admin@domain.com"
                required
                :disabled="loading"
                autocomplete="email"
                @blur="validateEmail"
              />
            </div>
            <span v-if="fieldErrors.email" class="field-error">{{
              fieldErrors.email
            }}</span>
          </div>

          <div
            class="field-group"
            :class="{ 'field-group--error': fieldErrors.password }"
          >
            <label class="field-label">Password</label>
            <div class="field-wrap">
              <svg class="field-icon" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="••••••••"
                required
                :disabled="loading"
                autocomplete="current-password"
                @blur="validatePassword"
              />
              <button
                type="button"
                class="toggle-pw"
                @click="showPassword = !showPassword"
                :disabled="loading"
              >
                <!-- Eye open -->
                <svg
                  v-if="!showPassword"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fill-rule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- Eye closed -->
                <svg v-else viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                    clip-rule="evenodd"
                  />
                  <path
                    d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                  />
                </svg>
              </button>
            </div>
            <span v-if="fieldErrors.password" class="field-error">{{
              fieldErrors.password
            }}</span>
          </div>

          <div class="form-options">
            <label class="remember-label">
              <input
                type="checkbox"
                v-model="form.remember"
                class="remember-check"
              />
              <span class="remember-custom" />
              <span>Remember me</span>
            </label>
          </div>

          <button
            class="submit-btn"
            type="submit"
            :disabled="loading"
            :class="{ loading }"
          >
            <Transition name="btn-text" mode="out-in">
              <span v-if="!loading" key="idle" class="btn-idle">
                Sign In
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M3 10a1 1 0 011-1h10.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H4a1 1 0 01-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
              <span v-else key="busy" class="btn-busy">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                    stroke-opacity="0.25"
                  />
                  <path
                    d="M12 2a10 10 0 0 1 10 10"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                  />
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
              <path
                fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Back to website
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";

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
  --gold: #c9a96e;
  --gold-light: #e8d5b0;
  --gold-dim: #8b6f47;
  --gold-glow: rgba(201, 169, 110, 0.1);
  --gold-glow-str: rgba(201, 169, 110, 0.2);
  --onyx: #0d0d0f;
  --onyx-2: #131316;
  --onyx-3: #1a1a1f;
  --onyx-4: #222228;
  --onyx-5: #2c2c33;
  --smoke: rgba(255, 255, 255, 0.04);
  --smoke-hover: rgba(255, 255, 255, 0.07);
  --text-primary: #f0eae0;
  --text-secondary: rgba(240, 234, 224, 0.55);
  --text-muted: rgba(240, 234, 224, 0.28);
  --border: rgba(201, 169, 110, 0.13);
  --border-strong: rgba(201, 169, 110, 0.3);
}

/* ── Shell ── */
.admin-login {
  min-height: 100vh;
  display: flex;
  background: var(--onyx);
  font-family: "Jost", "Inter", sans-serif;
}

/* ══════════════════════════════════════
   LEFT PANEL
══════════════════════════════════════ */
.login-left {
  position: relative;
  width: 42%;
  background: var(--onyx-2);
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
  background: radial-gradient(
    circle,
    rgba(201, 169, 110, 0.1) 0%,
    transparent 65%
  );
}
.left-glow--mid {
  top: 40%;
  left: 30%;
  width: 280px;
  height: 280px;
  background: radial-gradient(
    circle,
    rgba(201, 169, 110, 0.05) 0%,
    transparent 70%
  );
}
.left-glow--bottom {
  bottom: -80px;
  right: -60px;
  width: 300px;
  height: 300px;
  background: radial-gradient(
    circle,
    rgba(201, 169, 110, 0.07) 0%,
    transparent 65%
  );
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
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(201, 169, 110, 0.06) 30%,
    rgba(201, 169, 110, 0.06) 70%,
    transparent
  );
}
.grid-line--h {
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(201, 169, 110, 0.06) 30%,
    rgba(201, 169, 110, 0.06) 70%,
    transparent
  );
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
  width: 40px;
  height: 40px;
  border: 1px solid var(--gold-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: var(--gold);
  flex-shrink: 0;
}
.brand-mark::before {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px solid var(--gold);
  opacity: 0.3;
}
.brand-mark svg {
  width: 18px;
  height: 18px;
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.brand-name {
  font-family: "Cormorant Garamond", "Georgia", serif;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  line-height: 1;
}
.brand-sub {
  font-size: 9px;
  font-weight: 300;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gold);
  line-height: 1;
}

/* Quote */
.left-quote {
  position: relative;
  z-index: 1;
}
.quote-rule {
  width: 32px;
  height: 2px;
  background: linear-gradient(to right, var(--gold), transparent);
  margin-bottom: 20px;
}
.quote-text {
  font-family: "Cormorant Garamond", "Georgia", serif;
  font-size: 32px;
  font-weight: 300;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  margin: 0 0 14px;
}
.quote-sub {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.08em;
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
  gap: 3px;
}
.stat-value {
  font-family: "Cormorant Garamond", "Georgia", serif;
  font-size: 18px;
  font-weight: 500;
  color: var(--gold-light);
  letter-spacing: 0.04em;
}
.stat-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-muted);
}
.stat-divider {
  width: 1px;
  height: 30px;
  background: var(--border-strong);
}

/* ══════════════════════════════════════
   RIGHT PANEL
══════════════════════════════════════ */
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  position: relative;
  background: var(--onyx-3);
}

.right-glow {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(201, 169, 110, 0.06) 0%,
    transparent 65%
  );
  pointer-events: none;
}

.login-box {
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
}

/* ── Header ── */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.logo-wrap {
  display: inline-block;
  margin-bottom: 20px;
}
.brand-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  border-radius: 8px;
}

.logo-mark-sm {
  width: 48px;
  height: 48px;
  border: 1px solid var(--gold-dim);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: var(--gold);
  margin-bottom: 20px;
}
.logo-mark-sm::before {
  content: "";
  position: absolute;
  inset: 4px;
  border: 1px solid var(--gold);
  opacity: 0.3;
}
.logo-mark-sm svg {
  width: 20px;
  height: 20px;
}

.login-title {
  font-family: "Cormorant Garamond", "Georgia", serif;
  font-size: 30px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  margin: 0 0 8px;
}
.login-sub {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.06em;
  margin: 0;
}

/* ── Alerts ── */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border-left: 2px solid;
  font-size: 13px;
  letter-spacing: 0.02em;
  line-height: 1.5;
}
.alert svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.alert--error {
  background: rgba(201, 60, 60, 0.08);
  border-color: rgba(201, 60, 60, 0.6);
  color: #f09595;
}
.alert--success {
  background: rgba(29, 158, 117, 0.08);
  border-color: rgba(29, 158, 117, 0.5);
  color: #5dcaa5;
}

/* ── Form ── */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.field-group {
  margin-bottom: 20px;
}
.field-label {
  display: block;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.field-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.field-icon {
  position: absolute;
  left: 14px;
  width: 15px;
  height: 15px;
  color: var(--gold-dim);
  pointer-events: none;
  flex-shrink: 0;
}

.field-wrap input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  background: var(--onyx-4);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-size: 13.5px;
  font-family: inherit;
  letter-spacing: 0.02em;
  outline: none;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  border-radius: 0;
  /* Luxury: sharp corners, no radius */
}
.field-wrap input::placeholder {
  color: var(--text-muted);
}
.field-wrap input:focus {
  border-color: var(--gold-dim);
  background: var(--onyx-5);
  box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.08);
}
.field-wrap input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-pw {
  position: absolute;
  right: 12px;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  padding: 0;
}
.toggle-pw:hover {
  color: var(--gold);
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
  border-color: rgba(201, 60, 60, 0.5);
}
.field-error {
  display: block;
  font-size: 11px;
  color: #f09595;
  margin-top: 5px;
  letter-spacing: 0.02em;
}

/* ── Form options ── */
.form-options {
  display: flex;
  align-items: center;
  margin-bottom: 28px;
}
.remember-label {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  letter-spacing: 0.03em;
}
.remember-check {
  display: none;
}
.remember-custom {
  width: 14px;
  height: 14px;
  border: 1px solid var(--border-strong);
  background: var(--onyx-4);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.15s, background 0.15s;
}
.remember-check:checked + .remember-custom {
  background: var(--gold-glow);
  border-color: var(--gold);
}
.remember-check:checked + .remember-custom::after {
  content: "";
  position: absolute;
  left: 3px;
  top: 1px;
  width: 5px;
  height: 8px;
  border-right: 1.5px solid var(--gold);
  border-bottom: 1.5px solid var(--gold);
  transform: rotate(45deg);
}

/* ── Submit button ── */
.submit-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--gold-dim), var(--gold));
  color: var(--onyx);
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
}
.submit-btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}
.submit-btn:hover:not(:disabled)::before {
  opacity: 1;
}
.submit-btn:hover:not(:disabled) {
  box-shadow: 0 6px 24px rgba(201, 169, 110, 0.35);
  transform: translateY(-1px);
}
.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-idle,
.btn-busy {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
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
  margin-top: 28px;
  text-align: center;
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.15s;
}
.back-link:hover {
  color: var(--gold);
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
    background: var(--onyx-2);
  }
}

@media (max-width: 480px) {
  .login-right {
    padding: 32px 20px;
  }
  .login-title {
    font-size: 26px;
  }
  .quote-text {
    font-size: 26px;
  }
}
</style>
