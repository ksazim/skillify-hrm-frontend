<template>
  <Teleport to="body">
    <div v-if="modelValue" class="inv-overlay" @click.self="close">

      <!-- ══════ TOOLBAR — hidden on print ══════ -->
      <div class="inv-toolbar no-print">
        <div class="toolbar-brand">
          <span class="toolbar-icon">🧾</span>
          <span class="toolbar-label">Invoice Preview</span>
        </div>
        <div class="toolbar-actions">
          <button class="tb-btn tb-print" @click="printInvoice">🖨 Print</button>
          <button class="tb-btn tb-pdf" @click="downloadPDF" :disabled="isGenerating">
            <span v-if="isGenerating" class="tb-spin"></span>
            <span v-else>⬇</span>
            {{ isGenerating ? 'Generating PDF…' : 'Download PDF' }}
          </button>
          <button class="tb-btn tb-close" @click="close">✕</button>
        </div>
      </div>

      <!-- ══════ LOADING STATE ══════ -->
      <div v-if="loadingCompany" class="inv-loading no-print">
        <div class="inv-loading-spin"></div>
        <p>Loading company info…</p>
      </div>

      <!-- ══════ SCROLL AREA ══════ -->
      <div class="inv-scroll-area" v-else>

        <!-- THE PRINTABLE / PDF TARGET — only this node is captured -->
        <div class="inv-paper" ref="invoiceRef">

          <!-- Top accent bar -->
          <div class="inv-accent-bar">
            <div class="acc-dark"></div>
            <div class="acc-mid"></div>
            <div class="acc-light"></div>
          </div>

          <!-- ── HEADER ── -->
          <div class="inv-head">
            <div class="inv-company-block">
              <div class="inv-logo-wrap">
                <!-- Normal src for live preview — base64 swap happens only in the PDF clone -->
                <img
                  v-if="company.logo"
                  :src="`${baseUrl}/${company.logo}`"
                  class="inv-logo-img"
                />
                <div v-else class="inv-logo-letter">
                  {{ company.brand_name?.charAt(0) || 'S' }}
                </div>
              </div>
              <div class="inv-company-info">
                <h1 class="inv-company-name">{{ company.brand_name || 'Your Store' }}</h1>
                <p v-if="company.tagline" class="inv-company-tag">{{ company.tagline }}</p>
                <p class="inv-company-contact">
                  <span v-if="company.email">{{ company.email }}</span>
                  <span v-if="company.phone" class="sep">·</span>
                  <span v-if="company.phone">{{ company.phone }}</span>
                </p>
                <p class="inv-company-addr">
                  <span v-if="company.address">{{ company.address }}</span>
                  <span v-if="company.city" class="sep">—</span>
                  <span v-if="company.city">{{ company.city }}</span>
                  <span v-if="company.country" class="sep">,</span>
                  <span v-if="company.country">{{ company.country }}</span>
                </p>
              </div>
            </div>

            <div class="inv-title-block">
              <h2 class="inv-word">INVOICE</h2>
              <div class="inv-meta-rows">
                <div class="inv-meta-row">
                  <span class="imr-label">Invoice No.</span>
                  <span class="imr-value inv-num">#{{ order?.invoice_no }}</span>
                </div>
                <div class="inv-meta-row">
                  <span class="imr-label">Date</span>
                  <span class="imr-value">{{ formatDate(order?.created_at) }}</span>
                </div>
                <div class="inv-meta-row">
                  <span class="imr-label">Status</span>
                  <span :class="['status-pill', 'status-' + order?.status]">
                    {{ capitalize(order?.status) }}
                  </span>
                </div>
                <div v-if="order?.consignment" class="inv-meta-row">
                  <span class="imr-label">Consignment</span>
                  <span class="imr-value">{{ order.consignment }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Rule -->
          <div class="inv-rule">
            <div class="rule-line"></div>
            <span class="rule-diamond">◆</span>
            <div class="rule-line"></div>
          </div>

          <!-- ── ADDRESSES ── -->
          <div class="inv-addr-row">
            <div class="inv-addr-box">
              <p class="addr-label">FROM</p>
              <p class="addr-name">{{ company.brand_name }}</p>
              <p v-if="company.address" class="addr-line">{{ company.address }}</p>
              <p v-if="company.city" class="addr-line">
                {{ company.city }}<span v-if="company.zip_code">, {{ company.zip_code }}</span>
              </p>
              <p v-if="company.country" class="addr-line">{{ company.country }}</p>
              <p v-if="company.email" class="addr-line">{{ company.email }}</p>
              <p v-if="company.phone" class="addr-line">{{ company.phone }}</p>
            </div>

            <div class="inv-addr-arrow">→</div>

            <div class="inv-addr-box inv-addr-to">
              <p class="addr-label">SHIP TO</p>
              <p class="addr-name">{{ order?.recipient_name }}</p>
              <p class="addr-line">{{ order?.recipient_phone }}</p>
              <p class="addr-line">{{ order?.recipient_address }}</p>
              <p v-if="order?.city" class="addr-line">{{ order.city }}</p>
              <div class="addr-pills">
                <span class="delivery-pill">{{ capitalize(order?.delivery_option) }}</span>
                <span v-if="order?.coupon_code" class="coupon-pill">🏷 {{ order.coupon_code }}</span>
              </div>
            </div>
          </div>

          <!-- ── ITEMS TABLE ── -->
          <div class="inv-table-wrap">
            <table class="inv-table">
              <thead>
                <tr>
                  <th class="th-num">#</th>
                  <th class="th-product">Product</th>
                  <th class="th-variant">Variant</th>
                  <th class="th-qty">Qty</th>
                  <th class="th-price">Unit Price</th>
                  <th class="th-total">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, i) in (order?.sell || [])"
                  :key="i"
                  :class="{ 'tr-alt': i % 2 === 1 }"
                >
                  <td class="td-num">{{ i + 1 }}</td>
                  <td class="td-product">{{ item.product_name }}</td>
                  <td class="td-variant">{{ formatVariants(item.variants) }}</td>
                  <td class="td-qty">{{ item.quantity }}</td>
                  <td class="td-price">{{ formatPrice(item.unit_price) }}</td>
                  <td class="td-total">{{ formatPrice(item.unit_price * item.quantity) }}</td>
                </tr>
                <tr v-if="!(order?.sell?.length)">
                  <td colspan="6" class="td-empty">No items on this order.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- ── TOTALS + NOTE ── -->
          <div class="inv-bottom-row">
            <div v-if="order?.note" class="inv-note-block">
              <p class="note-heading">Order Note</p>
              <p class="note-body">{{ order.note }}</p>
            </div>
            <div v-else class="inv-note-spacer"></div>

            <div class="inv-totals">
              <div class="total-line">
                <span class="tl-label">Subtotal</span>
                <span class="tl-val">{{ formatPrice(order?.subtotal) }}</span>
              </div>
              <div class="total-line">
                <span class="tl-label">Shipping</span>
                <span class="tl-val">{{ formatPrice(order?.shipping_cost) }}</span>
              </div>
              <div v-if="order?.vat && order.vat > 0" class="total-line">
                <span class="tl-label">VAT / Tax</span>
                <span class="tl-val">{{ formatPrice(order.vat) }}</span>
              </div>
              <div class="total-grand">
                <span class="tg-label">TOTAL DUE</span>
                <span class="tg-val">{{ formatPrice(order?.total) }}</span>
              </div>
            </div>
          </div>

          <!-- ── FOOTER ── -->
          <div class="inv-footer">
            <div class="footer-left">
              <p class="footer-thanks">
                {{ company.short_description || 'Thank you for your order!' }}
              </p>
              <p v-if="company.email" class="footer-sub">{{ company.email }}</p>
            </div>
            <div class="footer-stamp">
              <div
                :class="[
                  'stamp-ring',
                  order?.status === 'cancelled' ? 'stamp-void' : 'stamp-paid'
                ]"
              >
                {{ order?.status === 'cancelled' ? 'VOID' : 'PAID' }}
              </div>
            </div>
          </div>

          <!-- Bottom accent bar -->
          <div class="inv-accent-bar inv-accent-flip">
            <div class="acc-light"></div>
            <div class="acc-mid"></div>
            <div class="acc-dark"></div>
          </div>

        </div><!-- /inv-paper -->
      </div><!-- /inv-scroll-area -->

    </div><!-- /inv-overlay -->
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch, onMounted, defineProps, defineEmits } from 'vue';
import axios from 'axios';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  order:      { type: Object,  default: null  }
});
const emit = defineEmits(['update:modelValue']);

const baseApi = process.env.VUE_APP_BASE_API;
const baseUrl = process.env.VUE_APP_BASE_URL;

const invoiceRef     = ref(null);
const isGenerating   = ref(false);
const loadingCompany = ref(false);

/* ── Company data ─────────────────────────────────────────────── */
const company = reactive({
  brand_name:        '',
  tagline:           null,
  short_description: null,
  logo:              null,
  email:             '',
  phone:             '',
  address:           '',
  city:              '',
  zip_code:          '',
  country:           '',
  primary_color:     '#4f46e5',
  secondary_color:   '#10b981'
});

const fetchCompany = async () => {
  loadingCompany.value = true;
  try {
    const res = await axios.get(`${baseApi}/system`);
    const sys = res.data?.system || {};
    Object.assign(company, {
      brand_name:        sys.brand_name        || '',
      tagline:           sys.tagline           || null,
      short_description: sys.short_description || null,
      logo:              sys.logo              || null,
      email:             sys.email             || '',
      phone:             sys.phone             || '',
      address:           sys.address           || '',
      city:              sys.city              || '',
      zip_code:          sys.zip_code          || '',
      country:           sys.country           || '',
      primary_color:     sys.primary_color     || '#4f46e5',
      secondary_color:   sys.secondary_color   || '#10b981'
    });
  } catch (err) {
    console.error('Failed to load system info:', err);
  } finally {
    loadingCompany.value = false;
  }
};

// Fetch once on first open
watch(() => props.modelValue, (val) => {
  if (val && !company.brand_name) fetchCompany();
});
onMounted(() => {
  if (props.modelValue) fetchCompany();
});

/* ── Helpers ──────────────────────────────────────────────────── */
const close = () => emit('update:modelValue', false);

const capitalize = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatPrice = (v) =>
  v != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT' }).format(v)
    : '—';

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
};

const formatVariants = (raw) => {
  if (!raw) return '—';
  try {
    const v = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const entries = Object.entries(v).filter(([, val]) => val);
    return entries.length
      ? entries.map(([k, val]) => `${capitalize(k)}: ${val}`).join(', ')
      : '—';
  } catch (_err) {
    return String(raw) || '—';
  }
};

/* ── Print ────────────────────────────────────────────────────── */
const printInvoice = () => {
  const el = invoiceRef.value;
  if (!el) return;

  // Collect all scoped & global styles from the document
  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((r) => r.cssText).join('\n');
      } catch (_err) {
        return '';
      }
    })
    .join('\n');

  const win = window.open('', '_blank', 'width=900,height=750');
  win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <title>Invoice #${props.order?.invoice_no || ''}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap">
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #fff; }
      /* Force row layout — never collapse to column for print */
      .inv-head, .inv-addr-row, .inv-bottom-row, .inv-footer {
        display: flex !important;
        flex-direction: row !important;
      }
      ${styles}
      /* Override any responsive breakpoints — we always want full-width row layout */
      @media (max-width: 9999px) {
        .inv-paper      { width: 100% !important; box-shadow: none !important; }
        .inv-head       { flex-direction: row !important; padding: 28px 36px 22px !important; }
        .inv-title-block{ text-align: right !important; }
        .inv-meta-rows  { align-items: flex-end !important; }
        .inv-addr-row   { flex-direction: row !important; padding: 18px 36px 22px !important; }
        .inv-addr-arrow { display: block !important; }
        .inv-addr-to    { text-align: right !important; }
        .addr-pills     { justify-content: flex-end !important; }
        .inv-table-wrap { padding: 0 36px 24px !important; }
        .inv-bottom-row { flex-direction: row !important; padding: 4px 36px 28px !important; }
        .inv-totals     { width: 290px !important; }
        .inv-footer     { flex-direction: row !important; padding: 18px 36px 22px !important; }
        .inv-rule       { padding: 0 36px !important; }
      }
      @page { margin: 0; size: A4 portrait; }
    </style>
  </head>
  <body>${el.outerHTML}</body>
</html>`);
  win.document.close();
  win.focus();
  // Small delay so fonts finish loading before the print dialog opens
  setTimeout(() => { win.print(); win.close(); }, 900);
};

/* ── PDF helpers ──────────────────────────────────────────────── */
const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s   = document.createElement('script');
    s.src     = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

/**
 * Convert any URL to a base64 data: URI via axios.
 * This keeps the canvas un-tainted so toDataURL() works even when
 * the image server does not send CORS headers.
 */
const urlToBase64 = async (url) => {
  const res  = await axios.get(url, { responseType: 'arraybuffer' });
  const mime = res.headers['content-type'] || 'image/png';
  const b64  = btoa(
    new Uint8Array(res.data).reduce((acc, byte) => acc + String.fromCharCode(byte), '')
  );
  return `data:${mime};base64,${b64}`;
};

const downloadPDF = async () => {
  const el = invoiceRef.value;
  if (!el) return;
  isGenerating.value = true;

  let container = null;

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

    const PAPER_W = 820;

    // ── 1. Deep-clone the invoice into a fixed off-screen container ──
    container = document.createElement('div');
    Object.assign(container.style, {
      position:   'fixed',
      top:        '-99999px',
      left:       '-99999px',
      width:      `${PAPER_W}px`,
      overflow:   'visible',
      zIndex:     '-1',
      background: '#ffffff',
    });

    const clone = el.cloneNode(true);
    Object.assign(clone.style, {
      width:    `${PAPER_W}px`,
      maxWidth: 'none',
    });

    // ── 2. Inject layout-lock styles so breakpoints never fire ──────
    const lockStyle = document.createElement('style');
    lockStyle.textContent = `
      .inv-head       { flex-direction: row !important; align-items: flex-start !important; }
      .inv-title-block{ text-align: right !important; }
      .inv-meta-rows  { align-items: flex-end !important; }
      .inv-addr-row   { flex-direction: row !important; align-items: center !important; }
      .inv-addr-arrow { display: block !important; }
      .inv-addr-to    { text-align: right !important; }
      .addr-pills     { justify-content: flex-end !important; }
      .inv-bottom-row { flex-direction: row !important; align-items: flex-start !important; }
      .inv-totals     { width: 290px !important; flex-shrink: 0 !important; }
      .inv-footer     { flex-direction: row !important; }
    `;
    clone.prepend(lockStyle);

    // ── 3. Replace the logo <img> src with a base64 data: URI ───────
    //    Steps: fetch → set src on the clone img → append to DOM →
    //    wait for the img to fire "load" before capturing.
    //    Doing it in this order ensures the browser has fully decoded
    //    the image before html2canvas runs.
    let logoDataUri = '';
    if (company.logo) {
      try {
        logoDataUri = await urlToBase64(`${baseUrl}/${company.logo}`);
      } catch (_err) {
        // fetch failed — logo will be absent but PDF won't crash
      }
    }

    // Patch the cloned <img> src BEFORE adding clone to DOM
    const logoImg = clone.querySelector('.inv-logo-img');
    if (logoImg) {
      if (logoDataUri) {
        logoImg.src = logoDataUri;
      } else {
        // Remove the broken img so the letter-avatar div shows instead
        logoImg.remove();
      }
    }

    container.appendChild(clone);
    document.body.appendChild(container);

    // Wait for the logo image to fully decode inside the live DOM node
    if (logoImg && logoDataUri) {
      await new Promise((resolve) => {
        if (logoImg.complete && logoImg.naturalWidth > 0) {
          resolve();
        } else {
          logoImg.onload  = resolve;
          logoImg.onerror = resolve; // resolve even on error so PDF still generates
        }
      });
    }

    // Extra rAF tick so the browser composites the newly-loaded image
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // ── 4. Capture — useCORS: false because all images are now data: URIs ──
    const canvas = await window.html2canvas(clone, {
      scale:           2.5,
      useCORS:         false,
      allowTaint:      false,
      backgroundColor: '#ffffff',
      logging:         false,
      width:           PAPER_W,
      windowWidth:     PAPER_W,
    });

    // ── 5. Build the PDF ─────────────────────────────────────────────
    const { jsPDF } = window.jspdf;
    const pdf   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW  = pageW;
    const imgH  = (canvas.height * pageW) / canvas.width;
    const img   = canvas.toDataURL('image/jpeg', 0.95); // safe — canvas is un-tainted

    let posY      = 0;
    let remaining = imgH;
    pdf.addImage(img, 'JPEG', 0, posY, imgW, imgH);
    remaining -= pageH;
    while (remaining > 0) {
      posY -= pageH;
      pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, posY, imgW, imgH);
      remaining -= pageH;
    }

    pdf.save(`invoice-${props.order?.invoice_no || 'order'}.pdf`);

  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Could not generate PDF. Please use the Print option instead.');
  } finally {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    isGenerating.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap');

/* ══ Overlay ══════════════════════════════════════════════════════ */
.inv-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(8, 12, 24, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

/* ══ Toolbar ══════════════════════════════════════════════════════ */
.inv-toolbar {
  width: 100%;
  background: #080c18;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #1a2540;
  font-family: 'IBM Plex Sans', sans-serif;
}
.toolbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #cbd5e1;
  font-weight: 600;
  font-size: 14px;
}
.toolbar-icon  { font-size: 18px; }
.toolbar-actions { display: flex; gap: 8px; align-items: center; }

.tb-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.tb-print { background: #1e3a5f; color: #93c5fd; }
.tb-print:hover { background: #1d4ed8; color: #fff; }
.tb-pdf   { background: #14532d; color: #86efac; }
.tb-pdf:hover:not(:disabled) { background: #166534; color: #fff; }
.tb-pdf:disabled { opacity: 0.5; cursor: not-allowed; }
.tb-close { background: #3b0f0f; color: #fca5a5; }
.tb-close:hover { background: #dc2626; color: #fff; }

.tb-spin {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: tb-spin-anim 0.6s linear infinite;
}
@keyframes tb-spin-anim { to { transform: rotate(360deg); } }

/* ══ Loading ══════════════════════════════════════════════════════ */
.inv-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px;
  color: #94a3b8;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
}
.inv-loading-spin {
  width: 40px;
  height: 40px;
  border: 3px solid #1a2540;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: tb-spin-anim 0.8s linear infinite;
}

/* ══ Scroll Area ══════════════════════════════════════════════════ */
.inv-scroll-area {
  padding: 36px 20px 64px;
  width: 100%;
  display: flex;
  justify-content: center;
}

/* ══ Paper ════════════════════════════════════════════════════════ */
.inv-paper {
  width: 820px;
  max-width: 100%;
  background: #ffffff;
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.6);
  font-family: 'IBM Plex Sans', sans-serif;
  overflow: hidden;
}

/* ══ Accent bars ══════════════════════════════════════════════════ */
.inv-accent-bar { display: flex; height: 8px; }
.acc-dark  { flex: 3; background: #080c18; }
.acc-mid   { flex: 2; background: #1e40af; }
.acc-light { flex: 1; background: #60a5fa; }
.inv-accent-flip .acc-dark  { background: #60a5fa; }
.inv-accent-flip .acc-mid   { background: #1e40af; }
.inv-accent-flip .acc-light { background: #080c18; }

/* ══ Header ═══════════════════════════════════════════════════════ */
.inv-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 36px 44px 28px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.inv-company-block {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}
.inv-logo-wrap {
  flex-shrink: 0;
  width: 76px;
  height: 76px;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inv-logo-img    { width: 100%; height: 100%; object-fit: contain; }
.inv-logo-letter {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  color: #fff;
  line-height: 1;
}
.inv-company-name {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: #080c18;
  margin: 0 0 3px;
}
.inv-company-tag {
  font-size: 10px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 0 0 8px;
}
.inv-company-contact,
.inv-company-addr {
  font-size: 11.5px;
  color: #475569;
  margin: 0 0 2px;
  line-height: 1.6;
}
.sep { color: #cbd5e1; margin: 0 5px; }

/* Title block */
.inv-title-block { text-align: right; }
.inv-word {
  font-family: 'Playfair Display', serif;
  font-size: 46px;
  font-weight: 900;
  color: #080c18;
  margin: 0 0 16px;
  letter-spacing: 6px;
  line-height: 1;
}
.inv-meta-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}
.inv-meta-row  { display: flex; align-items: center; gap: 14px; }
.imr-label {
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  min-width: 90px;
  text-align: right;
}
.imr-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  min-width: 130px;
  text-align: right;
}
.inv-num {
  font-family: 'IBM Plex Mono', monospace;
  color: #1e40af;
  font-size: 15px;
  font-weight: 700;
}

/* Status pills */
.status-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.status-pending    { background: #fef9c3; color: #854d0e; }
.status-confirmed  { background: #dbeafe; color: #1e40af; }
.status-paid       { background: #d1fae5; color: #065f46; }
.status-processing { background: #fce7f3; color: #9d174d; }
.status-delivered  { background: #dcfce7; color: #14532d; }
.status-cancelled  { background: #fee2e2; color: #991b1b; }

/* ══ Rule ═════════════════════════════════════════════════════════ */
.inv-rule {
  display: flex;
  align-items: center;
  padding: 0 44px;
}
.rule-line    { flex: 1; height: 1px; background: #e2e8f0; }
.rule-diamond { color: #3b82f6; font-size: 10px; padding: 12px 10px; }

/* ══ Addresses ════════════════════════════════════════════════════ */
.inv-addr-row {
  display: flex;
  align-items: center;
  padding: 22px 44px 26px;
}
.inv-addr-box   { flex: 1; }
.inv-addr-arrow {
  font-size: 22px;
  color: #cbd5e1;
  padding: 0 24px;
  flex-shrink: 0;
}
.inv-addr-to { text-align: right; }

.addr-label {
  font-size: 10px;
  font-weight: 800;
  color: #1e40af;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin: 0 0 7px;
}
.addr-name { font-size: 15px; font-weight: 700; color: #080c18; margin: 0 0 4px; }
.addr-line {
  font-size: 12px;
  color: #475569;
  margin: 0 0 3px;
  line-height: 1.6;
}
.addr-pills {
  display: flex;
  gap: 7px;
  margin-top: 7px;
  justify-content: flex-end;
}
.delivery-pill {
  padding: 3px 10px;
  background: #ede9fe;
  color: #5b21b6;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}
.coupon-pill {
  padding: 3px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
}

/* ══ Table ════════════════════════════════════════════════════════ */
.inv-table-wrap { padding: 0 44px 28px; }
.inv-table { width: 100%; border-collapse: collapse; }
.inv-table thead tr { background: #080c18; }
.inv-table th {
  padding: 11px 14px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.inv-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.inv-table .tr-alt td { background: #f8fafc; }
.inv-table tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }

.th-num, .td-num {
  width: 40px;
  text-align: center;
  color: #94a3b8;
  font-weight: 600;
}
.th-qty, .td-qty {
  width: 52px;
  text-align: center;
  font-weight: 700;
  color: #080c18;
}
.th-price, .td-price { width: 110px; text-align: right; }
.th-total, .td-total {
  width: 120px;
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 700;
  color: #080c18;
}
.td-variant { font-size: 11px; color: #94a3b8; width: 140px; }
.td-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 28px;
}

/* ══ Totals + Note ════════════════════════════════════════════════ */
.inv-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 4px 44px 32px;
  gap: 28px;
}
.inv-note-block {
  flex: 1;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 3px solid #3b82f6;
  min-height: 60px;
}
.inv-note-spacer { flex: 1; }
.note-heading {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 6px;
}
.note-body {
  font-size: 13px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

.inv-totals { width: 290px; flex-shrink: 0; }
.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 0;
  border-bottom: 1px solid #f1f5f9;
}
.tl-label { font-size: 13px; color: #64748b; font-weight: 500; }
.tl-val {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
}
.total-grand {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #080c18;
  padding: 14px 16px;
  border-radius: 8px;
  margin-top: 10px;
}
.tg-label {
  font-size: 10px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.tg-val {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 19px;
  font-weight: 700;
  color: #ffffff;
}

/* ══ Footer ═══════════════════════════════════════════════════════ */
.inv-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 44px 24px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}
.footer-thanks {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  color: #080c18;
  margin: 0 0 4px;
}
.footer-sub { font-size: 11px; color: #94a3b8; margin: 0; }

.footer-stamp { width: 68px; height: 68px; }
.stamp-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  transform: rotate(-18deg);
  opacity: 0.4;
}
.stamp-paid { border: 3px solid #16a34a; color: #16a34a; }
.stamp-void { border: 3px solid #dc2626; color: #dc2626; }

/* ══ Responsive ═══════════════════════════════════════════════════ */
@media (max-width: 880px) {
  .inv-paper { width: 100%; }
  .inv-head  { flex-direction: column; gap: 20px; padding: 24px 20px 16px; }
  .inv-title-block { text-align: left; }
  .inv-meta-rows   { align-items: flex-start; }
  .inv-addr-row    { flex-direction: column; gap: 16px; padding: 16px 20px; }
  .inv-addr-arrow  { display: none; }
  .inv-addr-to     { text-align: left; }
  .addr-pills      { justify-content: flex-start; }
  .inv-table-wrap  { padding: 0 20px 20px; }
  .inv-bottom-row  { flex-direction: column; padding: 0 20px 24px; }
  .inv-totals      { width: 100%; }
  .inv-footer      { padding: 16px 20px 20px; }
  .inv-rule        { padding: 0 20px; }
}
</style>