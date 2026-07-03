<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-backdrop" @click.self="$emit('update:modelValue', false)">
        <div class="modal-panel modal-panel--sm">
          <div class="modal-panel__head">
            <div class="modal-panel__head-left">
              <div class="modal-panel__icon" :class="data.danger ? 'modal-panel__icon--danger' : 'modal-panel__icon--primary'">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <h2 class="modal-panel__title">{{ data.title }}</h2>
            </div>
            <button class="modal-panel__close" @click="$emit('update:modelValue', false)">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
            </button>
          </div>
          <div class="modal-panel__body">
            <p class="confirm-message">{{ data.message }}</p>
          </div>
          <div class="modal-panel__foot">
            <button class="btn btn--ghost" @click="$emit('update:modelValue', false)">Cancel</button>
            <button
              class="btn"
              :class="data.danger ? 'btn--danger' : 'btn--primary'"
              @click="$emit('confirm')"
            >
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
.confirm-message { font-size: 13.5px; color: var(--text-2); line-height: 1.6; margin: 0; }
</style>
