<template>
  <footer class="footer">

    <!-- Gold top rule is provided by the layout border-top — we add the inner glow -->
    <div class="footer__glow" />

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
import { computed, defineProps } from 'vue'

defineProps({
  version: { type: String, default: '2.4.0' },
})

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.06);
  --onyx-2:         #131316;
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);

  font-family: 'Jost', 'Inter', sans-serif;
  position: relative;
  background: var(--onyx-2);
  min-height: 48px;
}

/* Subtle gold radial glow at the top-centre of the footer */
.footer__glow {
  position: absolute;
  top: -1px; left: 50%; transform: translateX(-50%);
  width: 60%; height: 1px;
  background: linear-gradient(90deg, transparent, var(--gold-dim), var(--gold), var(--gold-dim), transparent);
  pointer-events: none;
}

.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  height: 48px;
  flex-wrap: wrap;
}

/* ── Brand ── */
.footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.brand-mark {
  width: 22px; height: 22px;
  border: 1px solid var(--gold-dim);
  display: flex; align-items: center; justify-content: center;
  position: relative;
  color: var(--gold);
  flex-shrink: 0;
}
.brand-mark::before {
  content: '';
  position: absolute; inset: 2px;
  border: 1px solid var(--gold);
  opacity: .25;
}
.brand-mark svg { width: 10px; height: 10px; }

.brand-text { display: flex; align-items: baseline; gap: 4px; }
.brand-name {
  font-family: 'Cormorant Garamond', 'Georgia', serif;
  font-size: 14px; font-weight: 500;
  letter-spacing: .08em;
  color: var(--text-secondary);
  line-height: 1;
}
.brand-sub {
  font-size: 8.5px; font-weight: 400;
  letter-spacing: .18em; text-transform: uppercase;
  color: var(--gold-dim);
  line-height: 1;
}

/* ── Status ── */
.footer__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  letter-spacing: .06em;
  color: var(--text-muted);
}

.status-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #5DCAA5;
  box-shadow: 0 0 5px rgba(93,202,165,0.6);
  flex-shrink: 0;
}
.status-label { color: #5DCAA5; letter-spacing: .06em; }
.footer__version { color: var(--gold-dim); font-size: 10px; letter-spacing: .1em; }

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
  gap: 5px;
}
.footer__link {
  font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  transition: color .14s;
}
.footer__link:hover { color: var(--gold); }

.footer__sep { color: var(--border-strong); font-size: 10px; }

.footer__copy {
  font-size: 9.5px; letter-spacing: .06em;
  color: var(--text-muted);
}

/* ── Responsive ── */
@media (max-width: 767px) {
  .footer__inner { padding: 0 16px; height: auto; padding-top: 10px; padding-bottom: 10px; gap: 8px; }
  .footer__status { display: none; }
  .footer__right  { align-items: flex-start; }
}

@media (max-width: 480px) {
  .footer__brand { display: none; }
}
</style>