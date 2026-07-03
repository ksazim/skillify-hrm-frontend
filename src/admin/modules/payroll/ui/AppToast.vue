<template>
  <Transition name="toast">
    <div v-if="toast.visible" class="app-toast" :class="`app-toast--${toast.type}`">
      <svg v-if="toast.type === 'success'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
      {{ toast.message }}
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  toast: { type: Object, required: true } // { visible, message, type }
})
</script>

<style scoped>
.app-toast {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  border-radius: var(--radius-md);
  border: 1px solid;
  box-shadow: var(--shadow-lg);
  background: #fff;
}
.app-toast--success { color: var(--green-text); border-color: var(--green-border); background: var(--green-bg); }
.app-toast--error   { color: var(--red-text);   border-color: var(--red-border);   background: var(--red-bg);   }

.toast-enter-active, .toast-leave-active { transition: opacity .25s, transform .25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

@media (max-width: 640px) {
  .app-toast { left: 1rem; right: 1rem; bottom: 1rem; }
}
</style>
