<template>
  <div class="filter-panel" :class="{ 'filter-panel--collapsed': isCollapsed }">

    <!-- Panel header -->
    <div class="fp-header" @click="toggleCollapse">
      <div class="fp-header__left">
        <div class="fp-icon">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd"/>
          </svg>
        </div>
        <span class="fp-title">{{ title }}</span>
        <!-- Active filter count badge -->
        <span v-if="activeFilterCount > 0" class="fp-badge">{{ activeFilterCount }}</span>
      </div>
      <div class="fp-header__right">
        <span class="fp-toggle-hint">{{ isCollapsed ? 'Expand' : 'Collapse' }}</span>
        <svg class="fp-chevron" :class="{ 'fp-chevron--up': !isCollapsed }" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </div>
    </div>

    <!-- Panel body -->
    <Transition name="fp-body">
      <div v-show="!isCollapsed" class="fp-body">
        <form class="fp-form" @submit.prevent="handleSubmit" novalidate>

          <div class="fp-fields">
            <div
              v-for="field in fields"
              :key="field.name"
              class="fp-group"
              :class="`fp-group--${field.type}`"
            >
              <label class="fp-label" :for="field.name">{{ field.label }}</label>

              <!-- Text -->
              <div v-if="field.type === 'text'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
                </svg>
                <input
                  type="text"
                  :id="field.name"
                  class="fp-input fp-input--icon"
                  :placeholder="field.placeholder || ''"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
              </div>

              <!-- Number -->
              <div v-else-if="field.type === 'number'" class="fp-input-wrap">
                <input
                  type="number"
                  :id="field.name"
                  class="fp-input"
                  :placeholder="field.placeholder || ''"
                  :min="field.min"
                  :max="field.max"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
              </div>

              <!-- Date -->
              <div v-else-if="field.type === 'date'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
                <input
                  type="date"
                  :id="field.name"
                  class="fp-input fp-input--icon"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
              </div>

              <!-- DateTime -->
              <div v-else-if="field.type === 'datetime'" class="fp-input-wrap">
                <input
                  type="datetime-local"
                  :id="field.name"
                  class="fp-input"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
              </div>

              <!-- Email -->
              <div v-else-if="field.type === 'email'" class="fp-input-wrap">
                <svg class="fp-input-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <input
                  type="email"
                  :id="field.name"
                  class="fp-input fp-input--icon"
                  :placeholder="field.placeholder || ''"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
              </div>

              <!-- Select -->
              <div v-else-if="field.type === 'select'" class="fp-select-wrap">
                <select
                  :id="field.name"
                  class="fp-select"
                  :value="modelValue[field.name]"
                  @change="updateValue(field.name, $event.target.value)"
                >
                  <option value="">{{ field.placeholder || `All ${field.label}` }}</option>
                  <option
                    v-for="option in field.options"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
                </select>
                <svg class="fp-select-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </div>

              <!-- Multi-select -->
              <div v-else-if="field.type === 'multiselect'" class="fp-input-wrap">
                <select
                  :id="field.name"
                  class="fp-multiselect"
                  multiple
                  :value="modelValue[field.name]"
                  @change="updateMultiSelectValue(field.name, $event.target.selectedOptions)"
                >
                  <option
                    v-for="option in field.options"
                    :key="option.value"
                    :value="option.value"
                  >{{ option.label }}</option>
                </select>
              </div>

              <!-- Checkbox -->
              <div v-else-if="field.type === 'checkbox'" class="fp-checkbox-wrap">
                <label class="fp-checkbox-label" :for="field.name">
                  <input
                    type="checkbox"
                    :id="field.name"
                    class="fp-checkbox-input"
                    :checked="modelValue[field.name]"
                    @change="updateValue(field.name, $event.target.checked)"
                  />
                  <span class="fp-checkbox-box" />
                  <span class="fp-checkbox-text">{{ field.checkboxLabel || field.label }}</span>
                </label>
              </div>

              <!-- Radio -->
              <div v-else-if="field.type === 'radio'" class="fp-radio-group">
                <label
                  v-for="option in field.options"
                  :key="option.value"
                  class="fp-radio-label"
                >
                  <input
                    type="radio"
                    class="fp-radio-input"
                    :name="field.name"
                    :value="option.value"
                    :checked="modelValue[field.name] === option.value"
                    @change="updateValue(field.name, option.value)"
                  />
                  <span class="fp-radio-dot" />
                  <span class="fp-radio-text">{{ option.label }}</span>
                </label>
              </div>

              <!-- Range -->
              <div v-else-if="field.type === 'range'" class="fp-range-wrap">
                <input
                  type="range"
                  :id="field.name"
                  class="fp-range"
                  :min="field.min || 0"
                  :max="field.max || 100"
                  :step="field.step || 1"
                  :value="modelValue[field.name]"
                  @input="updateValue(field.name, $event.target.value)"
                />
                <span class="fp-range-value">{{ modelValue[field.name] }}</span>
              </div>

            </div>
          </div>

          <!-- Action buttons -->
          <div class="fp-actions">
            <button type="submit" class="fp-btn fp-btn--search">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>
              </svg>
              {{ submitLabel }}
            </button>
            <button type="button" class="fp-btn fp-btn--reset" @click="handleReset" :disabled="activeFilterCount === 0">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>
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
import { ref, computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  title:       { type: String, default: 'Search & Filter' },
  fields:      {
    type: Array, required: true,
    validator: fields => fields.every(f => f.name && f.type && f.label)
  },
  modelValue:  { type: Object, required: true },
  submitLabel: { type: String, default: 'Search' },
  resetLabel:  { type: String, default: 'Reset' },
  collapsible: { type: Boolean, default: true },
  startOpen:   { type: Boolean, default: true },
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
/* ── Tokens ── */
.filter-panel {
  --gold:           #C9A96E;
  --gold-light:     #E8D5B0;
  --gold-dim:       #8B6F47;
  --gold-glow:      rgba(201,169,110,0.09);
  --onyx-2:         #131316;
  --onyx-3:         #1A1A1F;
  --onyx-4:         #222228;
  --onyx-5:         #2C2C33;
  --smoke:          rgba(255,255,255,0.04);
  --smoke-hover:    rgba(255,255,255,0.07);
  --text-primary:   #F0EAE0;
  --text-secondary: rgba(240,234,224,0.55);
  --text-muted:     rgba(240,234,224,0.28);
  --border:         rgba(201,169,110,0.12);
  --border-strong:  rgba(201,169,110,0.28);

  font-family: 'Jost', 'Inter', sans-serif;
  background: var(--onyx-3);
  border-bottom: 1px solid var(--border);
}

/* ── Header ── */
.fp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  cursor: pointer;
  user-select: none;
  transition: background .15s;
  background: var(--onyx-2);
  border-bottom: 1px solid var(--border);
}
.fp-header:hover { background: var(--smoke-hover); }

.fp-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.fp-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fp-icon {
  width: 28px; height: 28px;
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--gold-dim);
  background: var(--smoke);
  transition: border-color .15s, color .15s;
}
.fp-header:hover .fp-icon { border-color:var(--border-strong); color:var(--gold); }
.fp-icon svg { width:13px; height:13px; }

.fp-title {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

.fp-badge {
  min-width: 18px; height: 18px;
  padding: 0 5px;
  background: var(--gold-glow);
  border: 1px solid var(--border-strong);
  color: var(--gold);
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: .06em;
  display: inline-flex; align-items: center; justify-content: center;
}

.fp-toggle-hint {
  font-size: 9.5px;
  color: var(--text-muted);
  letter-spacing: .1em;
  text-transform: uppercase;
}

.fp-chevron {
  width: 14px; height: 14px;
  color: var(--text-muted);
  transition: transform .22s;
}
.fp-chevron--up { transform: rotate(180deg); }

/* ── Body ── */
.fp-body {
  padding: 20px 0;
  overflow: hidden;
}

.fp-form { display: flex; flex-direction: column; gap: 16px; }

/* Fields grid */
.fp-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px 16px;
  align-items: end;
}

/* ── Field group ── */
.fp-group { display: flex; flex-direction: column; gap: 6px; }

.fp-label {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--text-muted);
}

/* ── Shared input style ── */
.fp-input,
.fp-select,
.fp-multiselect {
  width: 100%;
  background: var(--onyx-4);
  border: 1px solid var(--border);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 12.5px;
  letter-spacing: .02em;
  outline: none;
  transition: border-color .18s, background .18s, box-shadow .18s;
  box-sizing: border-box;
  padding: 9px 12px;
  border-radius: 0;
  appearance: none;
  -webkit-appearance: none;
}
.fp-input::placeholder { color: var(--text-muted); }
.fp-input:focus,
.fp-select:focus,
.fp-multiselect:focus {
  border-color: var(--gold-dim);
  background: var(--onyx-5);
  box-shadow: 0 0 0 2px rgba(201,169,110,0.07);
}

/* Input with icon */
.fp-input-wrap { position: relative; display: flex; align-items: center; }
.fp-input--icon { padding-left: 34px; }
.fp-input-icon {
  position: absolute;
  left: 11px;
  width: 13px; height: 13px;
  color: var(--gold-dim);
  pointer-events: none;
  flex-shrink: 0;
}

/* Select wrapper */
.fp-select-wrap { position: relative; }
.fp-select-arrow {
  position: absolute;
  right: 10px; top: 50%;
  transform: translateY(-50%);
  width: 13px; height: 13px;
  color: var(--gold-dim);
  pointer-events: none;
}
.fp-select { padding-right: 30px; cursor: pointer; }
.fp-select option { background: var(--onyx-4); color: var(--text-primary); }

/* Multi-select */
.fp-multiselect {
  min-height: 90px;
  padding: 6px 10px;
  resize: vertical;
}
.fp-multiselect option {
  padding: 4px 6px;
  background: var(--onyx-4);
  color: var(--text-secondary);
}
.fp-multiselect option:checked {
  background: var(--gold-glow);
  color: var(--gold-light);
}

/* Date input calendar icon colour (webkit) */
input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(0.6) sepia(1) saturate(2) hue-rotate(5deg);
  opacity: .7;
  cursor: pointer;
}

/* ── Checkbox ── */
.fp-checkbox-wrap { padding: 6px 0; }
.fp-checkbox-input { display: none; }
.fp-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}
.fp-checkbox-box {
  width: 16px; height: 16px;
  flex-shrink: 0;
  border: 1px solid var(--border-strong);
  background: var(--onyx-4);
  position: relative;
  transition: background .14s, border-color .14s;
}
.fp-checkbox-input:checked + .fp-checkbox-box {
  background: var(--gold-glow);
  border-color: var(--gold);
}
.fp-checkbox-input:checked + .fp-checkbox-box::after {
  content: '';
  position: absolute;
  left: 3px; top: 1px;
  width: 6px; height: 9px;
  border-right: 1.5px solid var(--gold);
  border-bottom: 1.5px solid var(--gold);
  transform: rotate(45deg);
}
.fp-checkbox-text { font-size: 12.5px; color: var(--text-secondary); letter-spacing: .02em; }

/* ── Radio ── */
.fp-radio-group { display: flex; flex-direction: column; gap: 7px; padding-top: 2px; }
.fp-radio-input { display: none; }
.fp-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}
.fp-radio-dot {
  width: 14px; height: 14px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--onyx-4);
  flex-shrink: 0;
  position: relative;
  transition: border-color .14s;
}
.fp-radio-input:checked + .fp-radio-dot {
  border-color: var(--gold);
  background: var(--gold-glow);
}
.fp-radio-input:checked + .fp-radio-dot::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--gold);
}
.fp-radio-text { font-size: 12.5px; color: var(--text-secondary); letter-spacing: .02em; }

/* ── Range ── */
.fp-range-wrap { display: flex; align-items: center; gap: 12px; }
.fp-range {
  flex: 1;
  -webkit-appearance: none;
  height: 2px;
  background: var(--border-strong);
  outline: none;
  cursor: pointer;
}
.fp-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  background: var(--gold);
  border: 1px solid var(--gold-dim);
  cursor: pointer;
  transition: box-shadow .14s;
}
.fp-range::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 4px rgba(201,169,110,0.15);
}
.fp-range::-moz-range-thumb {
  width: 14px; height: 14px;
  background: var(--gold);
  border: 1px solid var(--gold-dim);
  border-radius: 0;
  cursor: pointer;
}
.fp-range-value {
  font-family: 'Cormorant Garamond','Georgia',serif;
  font-size: 15px;
  font-weight: 500;
  color: var(--gold-light);
  min-width: 36px;
  text-align: right;
  letter-spacing: .04em;
}

/* ── Action buttons ── */
.fp-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.fp-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  font-family: inherit;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: .12em;
  text-transform: uppercase;
  border: 1px solid;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s, transform .12s;
  white-space: nowrap;
  border-radius: 0;
}
.fp-btn:active:not(:disabled) { transform: scale(.98); }
.fp-btn svg { width:13px; height:13px; flex-shrink:0; }

/* Search button — gold gradient */
.fp-btn--search {
  background: linear-gradient(135deg, var(--gold-dim), var(--gold));
  border-color: transparent;
  color: #0D0D0F;
  position: relative;
  overflow: hidden;
}
.fp-btn--search::before {
  content: '';
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.08);
  opacity: 0;
  transition: opacity .14s;
}
.fp-btn--search:hover::before { opacity: 1; }
.fp-btn--search:hover { box-shadow: 0 4px 18px rgba(201,169,110,0.28); transform: translateY(-1px); }

/* Reset button — ghost */
.fp-btn--reset {
  background: transparent;
  border-color: var(--border-strong);
  color: var(--text-muted);
}
.fp-btn--reset:hover:not(:disabled) { border-color: var(--border-strong); color: var(--text-secondary); background: var(--smoke-hover); }
.fp-btn--reset:disabled { opacity: .35; cursor: not-allowed; }

/* ── Collapse transition ── */
.fp-body-enter-active { transition: max-height .26s cubic-bezier(.4,0,.2,1), opacity .2s ease; max-height: 800px; }
.fp-body-leave-active { transition: max-height .2s cubic-bezier(.4,0,.2,1), opacity .15s ease; }
.fp-body-enter-from,
.fp-body-leave-to    { max-height: 0; opacity: 0; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .fp-header { padding: 12px 18px; }
  .fp-body   { padding: 16px 0; }
  .fp-fields { grid-template-columns: 1fr; }
  .fp-toggle-hint { display: none; }
}
</style>