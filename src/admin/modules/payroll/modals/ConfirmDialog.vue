<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-panel modal-panel--sm">
          <div class="modal-panel__head">
            <div class="modal-panel__head-left">
              <div class="modal-panel__icon"
                :class="data.danger ? 'modal-panel__icon--danger' : 'modal-panel__icon--primary'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <h2 class="modal-panel__title">{{ data.title }}</h2>
            </div>
            <button class="modal-panel__close" @click="$emit('update:modelValue', false)">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>
          <div class="modal-panel__body">
            <p class="confirm-message">{{ data.message }}</p>
          </div>
          <div class="modal-panel__foot">
            <button class="btn btn--ghost" @click="$emit('update:modelValue', false)">Cancel</button>
            <button class="btn" :class="data.danger ? 'btn--danger' : 'btn--primary'" @click="$emit('confirm')">
              {{ data.action }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, required: true },
  data: {
    type: Object,
    required: true // { title, message, action, danger }
  }
})
defineEmits(['update:modelValue', 'confirm'])
</script>

<style scoped>
/* ── Font Stack ───────────────────────────────────────────── */
.modal-panel {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ── Backdrop ─────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ── Panel Shell ──────────────────────────────────────────── */
.modal-panel {
  width: 100%;
  background: #ffffff;
  border-radius: 16px;
  box-shadow:
    0 24px 64px -12px rgba(15, 23, 42, 0.32),
    0 4px 16px -4px rgba(15, 23, 42, 0.14),
    0 0 0 1px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-panel--sm {
  max-width: 420px;
}

/* ── Header ───────────────────────────────────────────────── */
.modal-panel__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
}

.modal-panel__head-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.modal-panel__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-panel__icon--primary {
  background: #eef2ff;
  color: #4f46e5;
}

.modal-panel__icon--danger {
  background: #fef2f2;
  color: #dc2626;
}

.modal-panel__title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  letter-spacing: -0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-panel__close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-panel__close:hover {
  border-color: #fecaca;
  color: #dc2626;
  background: #fef2f2;
  transform: rotate(90deg);
}

.modal-panel__close:active {
  transform: rotate(90deg) scale(0.92);
}

/* ── Body ─────────────────────────────────────────────────── */
.modal-panel__body {
  padding: 4px 20px 22px 68px;
}

.confirm-message {
  font-size: 13.5px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

/* ── Footer ───────────────────────────────────────────────── */
.modal-panel__foot {
  position: relative;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: #f9fafb;
}

.modal-panel__foot::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 1px;
  background: #e5e7eb;
}

/* ── Buttons ──────────────────────────────────────────────── */
.btn {
  padding: 0 18px;
  font-size: 13.5px;
  font-weight: 650;
  border-radius: 10px;
  border: 1.5px solid transparent;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  font-family: inherit;
  letter-spacing: -0.01em;
  cursor: pointer;
}

.btn--ghost {
  background: #ffffff;
  color: #374151;
  border-color: #e5e7eb;
}

.btn--ghost:hover {
  border-color: #d1d5db;
  color: #111827;
  background: #f9fafb;
  transform: translateY(-1px);
}

.btn--ghost:active {
  transform: translateY(0);
}

.btn--primary {
  background: linear-gradient(180deg, #4f46e5 0%, #4338ca 100%);
  color: #ffffff;
  border-color: #4f46e5;
  box-shadow: 0 2px 8px -2px rgba(79, 70, 229, 0.45);
}

.btn--primary:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -4px rgba(79, 70, 229, 0.5);
}

.btn--primary:active {
  transform: translateY(0);
  filter: brightness(0.98);
  box-shadow: 0 2px 6px -2px rgba(79, 70, 229, 0.4);
}

.btn--danger {
  background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  border-color: #dc2626;
  box-shadow: 0 2px 8px -2px rgba(220, 38, 38, 0.45);
}

.btn--danger:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -4px rgba(220, 38, 38, 0.5);
}

.btn--danger:active {
  transform: translateY(0);
  filter: brightness(0.98);
  box-shadow: 0 2px 6px -2px rgba(220, 38, 38, 0.4);
}

/* ── Transition ───────────────────────────────────────────── */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(16px) scale(0.98);
  opacity: 0;
}

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 480px) {
  .modal-panel {
    border-radius: 14px;
  }

  .modal-panel__body {
    padding-left: 20px;
  }

  .modal-panel__foot {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .modal-panel__foot .btn {
    width: 100%;
  }
}
</style>