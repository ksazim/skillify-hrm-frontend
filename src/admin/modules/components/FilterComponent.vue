<template>
  <div class="filter-panel">
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
            <input type="text" :id="field.name" class="fp-input fp-input--icon" :placeholder="field.placeholder || ''"
              :value="modelValue[field.name]" @input="updateValue(field.name, $event.target.value)" />
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
            <input type="email" :id="field.name" class="fp-input fp-input--icon" :placeholder="field.placeholder || ''"
              :value="modelValue[field.name]" @input="updateValue(field.name, $event.target.value)" />
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
                :checked="modelValue[field.name] === option.value" @change="updateValue(field.name, option.value)" />
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
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  title: { type: String, default: 'Search & Filter' },
  fields: {
    type: Array, required: true,
    validator: fields => fields.every(f => f.name && f.type && f.label)
  },
  modelValue: { type: Object, required: true },
  submitLabel: { type: String, default: 'Search' },
  resetLabel: { type: String, default: 'Reset' },
})

const emit = defineEmits(['update:modelValue', 'submit', 'reset'])

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

  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-muted: #94A3B8;

  --border: #E2E8F0;
  --border-strong: #CBD5E1;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

  --radius-sm: 8px;
  --radius-md: 10px;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  padding: 18px 20px;
  width: 100%;
  box-sizing: border-box;
}

/* Single-row horizontal toolbar: fields flow left-to-right, actions pinned to the end */
.fp-form {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 16px;
  width: 100%;
}

.fp-fields {
  display: flex;
  flex-flow: row wrap;
  align-items: flex-end;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}

/* ── Field group ── */
.fp-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 170px;
  min-width: 150px;
  max-width: 260px;
}

/* Search-style text fields get more room since they're usually the primary filter */
.fp-group--text,
.fp-group--email {
  flex: 2.2 1 260px;
  max-width: none;
}

.fp-group--checkbox,
.fp-group--radio {
  flex: 0 1 auto;
  min-width: 0;
  justify-content: flex-end;
}

.fp-group--range {
  flex: 1 1 200px;
}

.fp-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-secondary);
  white-space: nowrap;
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
  font-size: 13.5px;
  letter-spacing: 0.01em;
  outline: none;
  transition: all 0.15s ease;
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
}

/* Input with icon */
.fp-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.fp-input--icon {
  padding-left: 36px;
}

.fp-input-icon {
  position: absolute;
  left: 11px;
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
  padding-right: 34px;
  cursor: pointer;
}

.fp-select option {
  background: var(--bg);
  color: var(--text-primary);
}

/* Multi-select — capped height so it doesn't blow out the row */
.fp-multiselect {
  min-height: 40px;
  max-height: 40px;
  padding: 6px 10px;
  resize: vertical;
}

.fp-multiselect option {
  padding: 5px 8px;
  background: var(--bg);
  color: var(--text-secondary);
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
  padding: 9px 0 8px;
}

.fp-checkbox-input {
  display: none;
}

.fp-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.fp-checkbox-box {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  border: 2px solid var(--border-strong);
  border-radius: 5px;
  background: var(--bg);
  position: relative;
  transition: all 0.15s ease;
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
  left: 4px;
  top: 0px;
  width: 5px;
  height: 9px;
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
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 9px 0 8px;
}

.fp-radio-input {
  display: none;
}

.fp-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.fp-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  background: var(--bg);
  flex-shrink: 0;
  position: relative;
  transition: all 0.15s ease;
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
  gap: 12px;
  padding: 9px 0 8px;
}

.fp-range {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  cursor: pointer;
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
}

.fp-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #FFFFFF;
  cursor: pointer;
}

.fp-range-value {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--primary);
  min-width: 34px;
  text-align: right;
}

/* ── Action buttons ── */
.fp-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 0 0 auto;
  margin-left: auto;
}

.fp-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.fp-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.fp-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.fp-btn--search {
  background: var(--primary);
  border-color: var(--primary);
  color: #FFFFFF;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.fp-btn--search:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

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

/* ── Responsive ── */
@media (max-width: 1024px) {
  .fp-actions {
    margin-left: 0;
    flex: 1 1 100%;
    padding-top: 6px;
    border-top: 1px solid var(--border);
    margin-top: 2px;
  }
}

@media (max-width: 768px) {
  .filter-panel {
    padding: 14px 16px;
  }

  .fp-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .fp-group,
  .fp-group--text,
  .fp-group--email,
  .fp-group--range {
    flex: 1 1 auto;
    max-width: none;
    min-width: 0;
    width: 100%;
  }

  .fp-group--checkbox,
  .fp-group--radio {
    justify-content: flex-start;
  }

  .fp-actions {
    flex-direction: row;
    width: 100%;
  }

  .fp-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .filter-panel {
    padding: 12px;
    border-radius: var(--radius-sm);
  }

  .fp-input,
  .fp-select,
  .fp-multiselect {
    font-size: 12px;
    padding: 8px 10px;
  }

  .fp-input--icon {
    padding-left: 32px;
  }

  .fp-actions {
    flex-direction: column;
  }

  .fp-btn {
    font-size: 11.5px;
    padding: 9px 16px;
    width: 100%;
  }
}
</style>