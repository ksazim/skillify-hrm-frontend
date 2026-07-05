<template>
  <footer class="footer">

    <!-- Top border accent -->
    <div class="footer__accent" />

    <div class="footer__inner">

      <!-- Left — brand -->
      <div class="footer__brand">
        <div class="brand-mark">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2L3 7v11h5v-5h4v5h5V7z" />
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-name">Nexara</span>
          <span class="brand-sub">HRM</span>
        </div>
      </div>

      <!-- Centre — system status -->
      <div class="footer__status">
        <span class="status-dot" />
        <span class="status-label">All systems operational</span>
        <span class="footer__sep">·</span>
        <span class="footer__version">v{{ version }}</span>
      </div>

      <!-- Right — copyright + links -->
      <div class="footer__right">
        <nav class="footer__links" aria-label="Footer links">
          <a href="#" class="footer__link" @click.prevent>Privacy</a>
          <span class="footer__sep">·</span>
          <a href="#" class="footer__link" @click.prevent>Terms</a>
          <span class="footer__sep">·</span>
          <a href="#" class="footer__link" @click.prevent>Support</a>
        </nav>
        <span class="footer__copy">
          &copy; {{ currentYear }} Nexara. All rights reserved.
        </span>
      </div>

    </div>
  </footer>
</template>

<script setup>
import { computed, defineProps } from 'vue';

defineProps({
  version: { type: String, default: '2.4.0' },
})

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
/* ── Light Theme Tokens ── */
.footer {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-hover: #F8FAFC;
  --bg-secondary: #F8FAFC;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);

  --radius-sm: 6px;
  --radius-md: 8px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  position: relative;
  background: var(--bg);
  border-top: 1px solid var(--border);
  min-height: 56px;
}

/* Top accent line */
.footer__accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  /* height: 2px; */
  background: linear-gradient(90deg,
      transparent 0%,
      var(--primary) 20%,
      var(--primary-light) 50%,
      var(--primary) 80%,
      transparent 100%);
  pointer-events: none;
  opacity: 0.6;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 28px;
  height: 56px;
  flex-wrap: wrap;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── Brand ── */
.footer__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-mark {
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: var(--primary);
  flex-shrink: 0;
  background: var(--primary-light);
  transition: all 0.2s ease;
}

.brand-mark:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.brand-mark svg {
  width: 14px;
  height: 14px;
}

.brand-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1;
}

.brand-sub {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  line-height: 1;
}

/* ── Status ── */
.footer__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-radius: 20px;
  border: 1px solid var(--border);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10B981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
  flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.7;
    transform: scale(0.85);
  }
}

.status-label {
  color: #10B981;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.footer__sep {
  color: var(--border-strong);
  font-size: 12px;
}

.footer__version {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
}

/* ── Right ── */
.footer__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.footer__links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer__link {
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.15s ease;
  font-weight: 500;
  padding: 2px 0;
  position: relative;
}

.footer__link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1.5px;
  background: var(--primary);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.footer__link:hover {
  color: var(--primary);
}

.footer__link:hover::after {
  transform: scaleX(1);
}

.footer__sep {
  color: var(--border-strong);
  font-size: 12px;
}

.footer__copy {
  font-size: 10.5px;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  font-weight: 400;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .footer__inner {
    padding: 0 16px;
    height: auto;
    padding-top: 12px;
    padding-bottom: 12px;
    gap: 10px;
    flex-direction: column;
    align-items: center;
  }

  .footer__status {
    display: flex;
    font-size: 11px;
    padding: 3px 10px;
  }

  .footer__right {
    align-items: center;
  }

  .footer__links {
    gap: 6px;
  }

  .footer__link {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .footer__brand {
    display: none;
  }

  .footer__status {
    font-size: 10px;
    padding: 2px 8px;
    gap: 5px;
  }

  .status-dot {
    width: 5px;
    height: 5px;
  }

  .footer__copy {
    font-size: 9px;
  }

  .footer__link {
    font-size: 9px;
  }
}
</style>