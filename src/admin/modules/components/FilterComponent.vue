<template>
  <div class="filter-panel" :class="{ 'filter-panel--collapsed': isCollapsed }">

    <!-- Panel header -->
    <div class="fp-header" @click="toggleCollapse">
      <div class="fp-header__left">
        <div class="fp-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <span class="fp-title">{{ title }}</span>
        <!-- Active filter count badge -->
        <span v-if="activeFilterCount > 0" class="fp-badge">{{ activeFilterCount }}</span>
      </div>
      <div class="fp-header__right">
        <span class="fp-toggle-hint">{{ isCollapsed ? 'Expand' : 'Collapse' }}</span>
        <svg class="fp-chevron" :class="{ 'fp-chevron--up': !isCollapsed }" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd" />
        </svg>
      </div>
    </div>

    <!-- Panel body -->
    <Transition name="fp-body">
      <div v-show="!isCollapsed" class="fp-body">
        <form class="fp-form" @submit.prevent="handleSubmit" novalidate>

          <div class="fp-fields">
            <div v-for="field in fields" :key="field.name" class="fp-group" :class="`fp-group--${field.type}`">
              <label class="fp-label" :for="field.name">{{ field.label }}</label>

              <!-- Text -->
              <div v-if="field.type === 'text'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clip-rule="evenodd" />
                </svg>
                <input type="text" :id="field.name" class="fp-input fp-input--icon"
                  :placeholder="field.placeholder || ''" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
              </div>

              <!-- Number -->
              <div v-else-if="field.type === 'number'" class="fp-input-wrap">
                <input type="number" :id="field.name" class="fp-input" :placeholder="field.placeholder || ''"
                  :min="field.min" :max="field.max" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
              </div>

              <!-- Date -->
              <div v-else-if="field.type === 'date'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd" />
                </svg>
                <input type="date" :id="field.name" class="fp-input fp-input--icon" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
              </div>

              <!-- DateTime -->
              <div v-else-if="field.type === 'datetime'" class="fp-input-wrap">
                <input type="datetime-local" :id="field.name" class="fp-input" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
              </div>

              <!-- Email -->
              <div v-else-if="field.type === 'email'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <input type="email" :id="field.name" class="fp-input fp-input--icon"
                  :placeholder="field.placeholder || ''" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
              </div>

              <!-- Select -->
              <div v-else-if="field.type === 'select'" class="fp-select-wrap">
                <select :id="field.name" class="fp-select" :value="modelValue[field.name]"
                  @change="updateValue(field.name, $event.target.value)">
                  <option value="">{{ field.placeholder || `All ${field.label}` }}</option>
                  <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}
                  </option>
                </select>
                <svg class="fp-select-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </div>

              <!-- Multi-select -->
              <div v-else-if="field.type === 'multiselect'" class="fp-input-wrap">
                <select :id="field.name" class="fp-multiselect" multiple :value="modelValue[field.name]"
                  @change="updateMultiSelectValue(field.name, $event.target.selectedOptions)">
                  <option v-for="option in field.options" :key="option.value" :value="option.value">{{ option.label }}
                  </option>
                </select>
              </div>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="fp-checkbox-wrap">
                <label class="fp-checkbox-label" :for="field.name">
                  <input type="checkbox" :id="field.name" class="fp-checkbox-input" :checked="modelValue[field.name]"
                    @change="updateValue(field.name, $event.target.checked)" />
                  <span class="fp-checkbox-box" />
                  <span class="fp-checkbox-text">{{ field.checkboxLabel || field.label }}</span>
                </label>
              </div>

              <!-- Radio -->
              <div v-else-if="field.type === 'radio'" class="fp-radio-group">
                <label v-for="option in field.options" :key="option.value" class="fp-radio-label">
                  <input type="radio" class="fp-radio-input" :name="field.name" :value="option.value"
                    :checked="modelValue[field.name] === option.value"
                    @change="updateValue(field.name, option.value)" />
                  <span class="fp-radio-dot" />
                  <span class="fp-radio-text">{{ option.label }}</span>
                </label>
              </div>

              <!-- Range -->
              <div v-else-if="field.type === 'range'" class="fp-range-wrap">
                <input type="range" :id="field.name" class="fp-range" :min="field.min || 0" :max="field.max || 100"
                  :step="field.step || 1" :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)" />
                <span class="fp-range-value">{{ modelValue[field.name] }}</span>
              </div>

            </div>
          </div>

          <!-- Action buttons -->
          <div class="fp-actions">
            <button type="submit" class="fp-btn fp-btn--search">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd" />
              </svg>
              {{ submitLabel }}
            </button>
            <button type="button" class="fp-btn fp-btn--reset" @click="handleReset" :disabled="activeFilterCount === 0">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                  clip-rule="evenodd" />
              </svg>
              {{ resetLabel }}
            </button>
          </div>

        </form>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Search & Filter' },
  fields: {
    type: Array, required: true,
    validator: fields => fields.every(f => f.name && f.type && f.label)
  },
  modelValue: { type: Object, required: true },
  submitLabel: { type: String, default: 'Search' },
  resetLabel: { type: String, default: 'Reset' },
  collapsible: { type: Boolean, default: true },
  startOpen: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset'])

// Collapse state
const isCollapsed = ref(!props.startOpen)
const toggleCollapse = () => { if (props.collapsible) isCollapsed.value = !isCollapsed.value }

// Count active filters (non-empty values)
const activeFilterCount = computed(() => {
  return Object.values(props.modelValue).filter(v => {
    if (Array.isArray(v)) return v.length > 0
    return v !== '' && v !== null && v !== undefined && v !== false
  }).length
})

const updateValue = (name, value) => emit('update:modelValue', { ...props.modelValue, [name]: value })

const updateMultiSelectValue = (name, selectedOptions) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [name]: Array.from(selectedOptions).map(o => o.value)
  })
}

const handleSubmit = () => emit('submit', props.modelValue)

const handleReset = () => {
  const reset = {}
  props.fields.forEach(f => {
    reset[f.name] = f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : ''
  })
  emit('update:modelValue', reset)
  emit('reset')
}
</script>

<style scoped>
/* ── Light Theme Variables ── */
.filter-panel {
  --primary: #4F46E5;
  --primary-light: #EEF2FF;
  --primary-hover: #4338CA;

  --bg: #FFFFFF;
  --bg-secondary: #F8FAFC;
  --bg-hover: #F1F5F9;
  --bg-active: #EEF2FF;

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;
  --text-light: #64748B;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --border-focus: #818CF8;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.2s ease;
}

.filter-panel:hover {
  box-shadow: var(--shadow-md);
}

/* ── Header ── */
.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.fp-header:hover {
  background: var(--bg-hover);
}

.fp-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fp-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fp-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary);
  background: var(--primary-light);
  transition: all 0.2s ease;
}

.fp-header:hover .fp-icon {
  border-color: var(--primary);
  transform: scale(1.05);
}

.fp-icon svg {
  width: 14px;
  height: 14px;
}

.fp-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.fp-badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary);
  border-radius: 10px;
  color: #FFFFFF;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.fp-toggle-hint {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.fp-chevron {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  transition: transform 0.25s ease;
}

.fp-chevron--up {
  transform: rotate(180deg);
}

/* ── Body ── */
.fp-body {
  padding: 20px;
  overflow: hidden;
  background: var(--bg);
}

.fp-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Fields grid */
.fp-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px 20px;
  align-items: end;
}

/* ── Field group ── */
.fp-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fp-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}

/* ── Shared input style ── */
.fp-input,
.fp-select,
.fp-multiselect {
  width: 100%;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  letter-spacing: 0.01em;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  padding: 9px 12px;
  appearance: none;
  -webkit-appearance: none;
}

.fp-input::placeholder {
  color: var(--text-muted);
}

.fp-input:hover,
.fp-select:hover,
.fp-multiselect:hover {
  border-color: var(--border-strong);
}

.fp-input:focus,
.fp-select:focus,
.fp-multiselect:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px var(--primary-light);
  background: var(--bg);
}

/* Input with icon */
.fp-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.fp-input--icon {
  padding-left: 38px;
}

.fp-input-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  pointer-events: none;
  flex-shrink: 0;
}

/* Select wrapper */
.fp-select-wrap {
  position: relative;
}

.fp-select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.fp-select {
  padding-right: 36px;
  cursor: pointer;
  background-image: none;
}

.fp-select option {
  background: var(--bg);
  color: var(--text-primary);
  padding: 4px 8px;
}

/* Multi-select */
.fp-multiselect {
  min-height: 90px;
  padding: 8px 10px;
  resize: vertical;
}

.fp-multiselect option {
  padding: 6px 8px;
  background: var(--bg);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  transition: all 0.15s ease;
}

.fp-multiselect option:hover {
  background: var(--bg-hover);
}

.fp-multiselect option:checked {
  background: var(--primary-light);
  color: var(--primary);
}

/* Date input styling */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: none;
  opacity: 0.6;
  cursor: pointer;
  padding: 4px;
}

input[type="date"]::-webkit-calendar-picker-indicator:hover,
input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

/* ── Checkbox ── */
.fp-checkbox-wrap {
  padding: 4px 0;
}

.fp-checkbox-input {
  display: none;
}

.fp-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.fp-checkbox-box {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--bg);
  position: relative;
  transition: all 0.2s ease;
}

.fp-checkbox-label:hover .fp-checkbox-box {
  border-color: var(--primary);
}

.fp-checkbox-input:checked+.fp-checkbox-box {
  background: var(--primary);
  border-color: var(--primary);
}

.fp-checkbox-input:checked+.fp-checkbox-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border-right: 2px solid #FFFFFF;
  border-bottom: 2px solid #FFFFFF;
  transform: rotate(45deg);
}

.fp-checkbox-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ── Radio ── */
.fp-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 2px;
}

.fp-radio-input {
  display: none;
}

.fp-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.fp-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  background: var(--bg);
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.fp-radio-label:hover .fp-radio-dot {
  border-color: var(--primary);
}

.fp-radio-input:checked+.fp-radio-dot {
  border-color: var(--primary);
  background: var(--primary);
}

.fp-radio-input:checked+.fp-radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #FFFFFF;
}

.fp-radio-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ── Range ── */
.fp-range-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 0;
}

.fp-range {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.fp-range:hover {
  background: var(--border-strong);
}

.fp-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}

.fp-range::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
}

.fp-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}

.fp-range-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
  min-width: 40px;
  text-align: right;
}

/* ── Action buttons ── */
.fp-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.fp-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 20px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.fp-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.fp-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Search button */
.fp-btn--search {
  background: var(--primary);
  border-color: var(--primary);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
}

.fp-btn--search:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(79, 70, 229, 0.3);
}

.fp-btn--search:active {
  transform: translateY(0px) scale(0.96);
}

/* Reset button */
.fp-btn--reset {
  background: transparent;
  border-color: var(--border);
  color: var(--text-secondary);
}

.fp-btn--reset:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-primary);
  background: var(--bg-hover);
}

.fp-btn--reset:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Collapse transition ── */
.fp-body-enter-active {
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  max-height: 800px;
  overflow: hidden;
}

.fp-body-leave-active {
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  overflow: hidden;
}

.fp-body-enter-from,
.fp-body-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .fp-header {
    padding: 10px 16px;
  }

  .fp-body {
    padding: 16px;
  }

  .fp-fields {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .fp-toggle-hint {
    display: none;
  }

  .fp-actions {
    flex-direction: column;
  }

  .fp-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .filter-panel {
    border-radius: var(--radius-sm);
  }

  .fp-header {
    padding: 8px 12px;
  }

  .fp-body {
    padding: 12px;
  }

  .fp-title {
    font-size: 12px;
  }

  .fp-icon {
    width: 28px;
    height: 28px;
  }

  .fp-icon svg {
    width: 12px;
    height: 12px;
  }

  .fp-input,
  .fp-select,
  .fp-multiselect {
    font-size: 12px;
    padding: 7px 10px;
  }

  .fp-input--icon {
    padding-left: 34px;
  }

  .fp-btn {
    font-size: 11px;
    padding: 8px 16px;
  }
}
</style>