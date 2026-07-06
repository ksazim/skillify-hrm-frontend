<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal-box" :class="[`modal-box--${size}`, `modal-box--${mode}`]" role="dialog"
          :aria-labelledby="`modal-title-${uid}`" aria-modal="true">

          <!-- ── Header ── -->
          <div class="modal-header">
            <!-- Mode indicator line -->
            <div class="modal-header__rule" :class="`rule--${mode}`" />

            <div class="modal-header__inner">
              <div class="modal-header__title-wrap">
                <!-- Mode icon mark -->
                <div class="modal-mode-mark" :class="`mode-mark--${mode}`">
                  <!-- create -->
                  <svg v-if="mode === 'create'" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clip-rule="evenodd" />
                  </svg>
                  <!-- edit -->
                  <svg v-else-if="mode === 'edit'" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <!-- delete -->
                  <svg v-else-if="mode === 'delete'" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                  <!-- view -->
                  <svg v-else viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fill-rule="evenodd"
                      d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p class="modal-mode-label">{{ modeLabel }}</p>
                  <h3 class="modal-title" :id="`modal-title-${uid}`">{{ computedTitle }}</h3>
                </div>
              </div>

              <button class="modal-close" @click="handleClose" :disabled="loading" aria-label="Close">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <!-- ── Body ── -->
          <div class="modal-body">

            <!-- DELETE mode -->
            <template v-if="mode === 'delete'">
              <div class="delete-zone">
                <div class="delete-zone__mark">
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd" />
                  </svg>
                </div>
                <p class="delete-zone__message">{{ deleteMessage || `Are you sure you want to delete this
                  ${entityName}?` }}</p>
                <p v-if="showDeleteWarning" class="delete-zone__warning">This action cannot be undone.</p>

                <div v-if="entityData && Object.keys(entityData).length" class="entity-detail-grid">
                  <div v-for="(value, key) in entityData" :key="key" class="entity-detail-row">
                    <span class="text-label">{{ formatLabel(key) }}</span>
                    <span class="text-body">{{ value }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- VIEW mode -->
            <template v-else-if="mode === 'view'">
              <div class="view-grid">
                <div v-for="field in fields" :key="field.name" v-show="!field.hidden" class="view-row">
                  <span class="view-row__label">{{ field.label }}</span>
                  <div class="view-row__value">

                    <!-- Image preview -->
                    <template v-if="field.type === 'file' && initialData[field.name]">
                      <div v-if="field.accept?.includes('image')" class="view-img-wrap">
                        <img :src="getExistingImageUrl(field)" :alt="field.label" class="view-img" />
                      </div>
                      <a v-else :href="getExistingImageUrl(field)" target="_blank" rel="noopener noreferrer"
                        class="view-file-link">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clip-rule="evenodd" />
                        </svg>
                        View file
                      </a>
                    </template>

                    <!-- Array values -->
                    <template v-else-if="Array.isArray(initialData[field.name])">
                      <span v-if="!initialData[field.name].length" class="view-empty">None</span>
                      <div v-else class="view-tags">
                        <span v-for="item in initialData[field.name]" :key="item" class="view-tag">{{
                          formatArrayItem(item, field) }}</span>
                      </div>
                    </template>

                    <!-- Boolean -->
                    <template v-else-if="typeof initialData[field.name] === 'boolean'">
                      <span class="bool-badge" :class="initialData[field.name] ? 'bool-badge--yes' : 'bool-badge--no'">
                        <svg v-if="initialData[field.name]" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd" />
                        </svg>
                        <svg v-else viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd" />
                        </svg>
                        {{ initialData[field.name] ? 'Yes' : 'No' }}
                      </span>
                    </template>

                    <!-- Default -->
                    <template v-else>
                      <span :class="!initialData[field.name] && initialData[field.name] !== 0 ? 'view-empty' : ''">
                        {{ formatViewValue(initialData[field.name], field) }}
                      </span>
                    </template>

                  </div>
                </div>
              </div>
            </template>

            <!-- CREATE / EDIT mode -->
            <template v-else>
              <form @submit.prevent="handleSubmit" class="modal-form" novalidate>

                <!-- API error alert -->
                <Transition name="alert">
                  <div v-if="apiError" class="form-alert form-alert--error">
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd" />
                    </svg>
                    <span>{{ apiError }}</span>
                  </div>
                </Transition>

                <div v-for="field in fields" :key="field.name" class="form-group" :class="{
                  'form-group--error': errors[field.name],
                  'form-group--hidden': field.hidden,
                }">
                  <!-- Label -->
                  <label v-if="field.type !== 'checkbox' && !field.hidden" :for="field.name" class="form-label">
                    {{ field.label }}
                    <span v-if="field.required" class="form-required">*</span>
                  </label>

                  <!-- Text / email / password / url -->
                  <div v-if="['text', 'email', 'password', 'url'].includes(field.type)" class="form-input-wrap">
                    <input :type="field.type === 'password' && showPassword[field.name] ? 'text' : field.type"
                      :id="field.name" class="form-input" :placeholder="field.placeholder || ''"
                      :required="field.required" :disabled="field.disabled || loading" :readonly="field.readonly"
                      v-model="formData[field.name]" @blur="validateField(field)" />
                    <!-- Password toggle -->
                    <button v-if="field.type === 'password'" type="button" class="form-pw-toggle"
                      @click="togglePassword(field.name)" :disabled="loading">
                      <svg v-if="!showPassword[field.name]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clip-rule="evenodd" />
                      </svg>
                      <svg v-else viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                          d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                          clip-rule="evenodd" />
                        <path
                          d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    </button>
                  </div>

                  <!-- Number -->
                  <input v-else-if="field.type === 'number'" type="number" :id="field.name" class="form-input"
                    :placeholder="field.placeholder || ''" :required="field.required"
                    :disabled="field.disabled || loading" :readonly="field.readonly" :min="field.min" :max="field.max"
                    :step="field.step || 1" v-model.number="formData[field.name]" @blur="validateField(field)" />

                  <!-- Textarea -->
                  <textarea v-else-if="field.type === 'textarea'" :id="field.name" class="form-textarea"
                    :placeholder="field.placeholder || ''" :required="field.required"
                    :disabled="field.disabled || loading" :readonly="field.readonly" :rows="field.rows || 4"
                    v-model="formData[field.name]" @blur="validateField(field)" />

                  <!-- Select -->
                  <div v-else-if="field.type === 'select'" class="form-select-wrap">
                    <select :id="field.name" class="form-select" :required="field.required"
                      :disabled="field.disabled || loading" v-model="formData[field.name]"
                      @change="validateField(field)">
                      <option value="" disabled>{{ field.placeholder || `Select ${field.label}` }}</option>
                      <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                    <svg class="form-select-arrow" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd" />
                    </svg>
                  </div>

                  <!-- Multi-select -->
                  <select v-else-if="field.type === 'multiselect'" :id="field.name" class="form-multiselect" multiple
                    :required="field.required" :disabled="field.disabled || loading" v-model="formData[field.name]"
                    @change="validateField(field)">
                    <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>

                  <!-- Date -->
                  <div v-else-if="field.type === 'date'" class="form-input-wrap">
                    <svg class="form-input-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd" />
                    </svg>
                    <input type="date" :id="field.name" class="form-input form-input--icon" :required="field.required"
                      :disabled="field.disabled || loading" :readonly="field.readonly" :min="field.min" :max="field.max"
                      v-model="formData[field.name]" @blur="validateField(field)" />
                  </div>

                  <!-- DateTime -->
                  <input v-else-if="field.type === 'datetime'" type="datetime-local" :id="field.name" class="form-input"
                    :required="field.required" :disabled="field.disabled || loading" :readonly="field.readonly"
                    v-model="formData[field.name]" @blur="validateField(field)" />

                  <!-- Time -->
                  <input v-else-if="field.type === 'time'" type="time" :id="field.name" class="form-input"
                    :required="field.required" :disabled="field.disabled || loading" :readonly="field.readonly"
                    v-model="formData[field.name]" @blur="validateField(field)" />

                  <!-- Checkbox -->
                  <div v-else-if="field.type === 'checkbox'" class="form-checkbox-wrap">
                    <label :for="field.name" class="form-checkbox-label">
                      <input type="checkbox" :id="field.name" class="form-checkbox-input"
                        :disabled="field.disabled || loading" v-model="formData[field.name]" />
                      <span class="form-checkbox-box" />
                      <span class="form-checkbox-text">
                        {{ field.label }}<span v-if="field.required" class="form-required"> *</span>
                      </span>
                    </label>
                  </div>

                  <!-- Radio -->
                  <div v-else-if="field.type === 'radio'" class="form-radio-group">
                    <label v-for="opt in field.options" :key="opt.value" class="form-radio-label">
                      <input type="radio" class="form-radio-input" :name="field.name" :value="opt.value"
                        :disabled="field.disabled || loading" v-model="formData[field.name]" />
                      <span class="form-radio-dot" />
                      <span class="form-radio-text">{{ opt.label }}</span>
                    </label>
                  </div>

                  <!-- File upload -->
                  <div v-else-if="field.type === 'file'" class="form-file-wrap">
                    <!-- Image preview -->
                    <div v-if="field.accept?.includes('image')" class="form-file-preview">
                      <div class="form-file-preview__frame">
                        <img :src="filePreview[field.name] || ''" v-if="filePreview[field.name]" :alt="field.label"
                          class="form-file-preview__img" />
                        <div v-else class="form-file-preview__empty">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clip-rule="evenodd" />
                          </svg>
                          <span>No image</span>
                        </div>
                        <button v-if="filePreview[field.name]" type="button" class="form-file-preview__remove"
                          @click="removeFilePreview(field.name)" :disabled="loading">
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clip-rule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <p class="form-file-preview__label">{{ filePreview[field.name] ?
                        (isFileObject(formData[field.name]) ? 'New image selected' : 'Current image')
                        : 'No image selected' }}</p>
                    </div>

                    <!-- File input button -->
                    <div class="form-file-input-wrap">
                      <label :for="field.name" class="form-file-btn" :class="{ 'form-file-btn--disabled': loading }">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd"
                            d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                            clip-rule="evenodd" />
                        </svg>
                        <span>{{ isFileObject(formData[field.name]) ? formData[field.name].name : 'Choose file'
                        }}</span>
                      </label>
                      <input type="file" :id="field.name" class="form-file-hidden" :accept="field.accept"
                        :multiple="field.multiple" :disabled="field.disabled || loading"
                        @change="handleFileChange(field, $event)" />
                    </div>
                  </div>

                  <!-- Color -->
                  <div v-else-if="field.type === 'color'" class="form-color-wrap">
                    <input type="color" :id="field.name" class="form-color-input" :disabled="field.disabled || loading"
                      v-model="formData[field.name]" />
                    <span class="form-color-value">{{ formData[field.name] }}</span>
                  </div>

                  <!-- Range -->
                  <div v-else-if="field.type === 'range'" class="form-range-wrap">
                    <input type="range" :id="field.name" class="form-range" :min="field.min || 0"
                      :max="field.max || 100" :step="field.step || 1" :disabled="field.disabled || loading"
                      v-model.number="formData[field.name]" />
                    <span class="form-range-value">{{ formData[field.name] }}</span>
                  </div>

                  <!-- Custom slot -->
                  <slot v-else-if="field.type === 'custom'" :name="`field-${field.name}`" :field="field"
                    :value="formData[field.name]" :updateValue="(val) => formData[field.name] = val" />

                  <!-- Description -->
                  <small v-if="field.description && !field.hidden" class="form-description">{{ field.description
                  }}</small>

                  <!-- Field error -->
                  <Transition name="alert">
                    <span v-if="errors[field.name]" class="form-field-error">
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd" />
                      </svg>
                      {{ errors[field.name] }}
                    </span>
                  </Transition>
                </div>

              </form>
            </template>
          </div>

          <!-- ── Footer ── -->
          <div class="modal-footer">
            <button type="button" class="modal-btn modal-btn--cancel" @click="handleClose" :disabled="loading">{{
              cancelLabel
            }}</button>

            <button type="button" class="modal-btn" :class="confirmBtnClass" @click="handleConfirm"
              :disabled="loading || (mode !== 'delete' && mode !== 'view' && !isFormValid)">
              <Transition name="btn-text" mode="out-in">
                <span v-if="loading" key="busy" class="modal-btn__busy">
                  <svg class="modal-spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none"
                      stroke-opacity=".25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" fill="none" />
                  </svg>
                  {{ loadingLabel }}
                </span>
                <span v-else key="idle">{{ resolvedConfirmLabel }}</span>
              </Transition>
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, defineEmits, defineProps, ref, watch } from 'vue'

// ── Unique ID for aria ─────────────────────────────────────────────────────────
const uid = Math.random().toString(36).slice(2, 8)

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  mode: { type: String, required: true, validator: v => ['create', 'edit', 'delete', 'view'].includes(v) },
  title: { type: String, default: '' },
  entityName: { type: String, default: 'item' },
  fields: { type: Array, default: () => [] },
  initialData: { type: Object, default: () => ({}) },
  api: { type: Object, default: () => ({}) },
  onSubmit: { type: Function, default: null },
  size: { type: String, default: 'medium', validator: v => ['small', 'medium', 'large', 'xlarge'].includes(v) },
  icon: { type: String, default: '' },
  closeOnOverlay: { type: Boolean, default: true },
  deleteMessage: { type: String, default: '' },
  showDeleteWarning: { type: Boolean, default: true },
  confirmLabel: { type: String, default: '' },
  cancelLabel: { type: String, default: 'Cancel' },
  loadingLabel: { type: String, default: 'Processing…' },
  transformData: { type: Function, default: null },
  customValidation: { type: Function, default: null },
  autoClose: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'submit', 'success', 'error', 'close', 'cancel'])

// ── State ──────────────────────────────────────────────────────────────────────
const formData = ref({})
const errors = ref({})
const loading = ref(false)
const apiError = ref('')
const filePreview = ref({})
const showPassword = ref({})

// ── Helpers ────────────────────────────────────────────────────────────────────
const isFileObject = (v) => {
  if (!v || typeof v !== 'object') return false
  if (typeof Blob !== 'undefined' && v instanceof Blob) return true
  if (typeof File !== 'undefined' && v instanceof File) return true
  return v.constructor?.name === 'File' || (v.name && v.size !== undefined && v.type !== undefined)
}

const togglePassword = (name) => { showPassword.value[name] = !showPassword.value[name] }

// ── Computed ───────────────────────────────────────────────────────────────────
const entity = computed(() => props.entityName.charAt(0).toUpperCase() + props.entityName.slice(1))

const computedTitle = computed(() => {
  if (props.title) return props.title
  const map = { create: `Create New ${entity.value}`, edit: `Edit ${entity.value}`, delete: `Delete ${entity.value}`, view: `${entity.value} Details` }
  return map[props.mode] ?? entity.value
})

const modeLabel = computed(() => {
  const map = { create: 'New record', edit: 'Editing record', delete: 'Confirm removal', view: 'Record details' }
  return map[props.mode] ?? ''
})

const resolvedConfirmLabel = computed(() => {
  if (props.confirmLabel) return props.confirmLabel
  const map = { create: 'Create', edit: 'Save changes', delete: 'Delete', view: 'Close' }
  return map[props.mode] ?? 'Confirm'
})

const confirmBtnClass = computed(() => {
  const map = { create: 'modal-btn--primary', edit: 'modal-btn--primary', delete: 'modal-btn--danger', view: 'modal-btn--ghost' }
  return map[props.mode] ?? 'modal-btn--primary'
})

const entityData = computed(() => {
  if (props.mode !== 'delete') return {}
  const d = { ...props.initialData }
    ;['id', '_id', 'createdAt', 'updatedAt', '__v'].forEach(k => delete d[k])
  return d
})

const isFormValid = computed(() =>
  props.fields.filter(f => f.required && !f.hidden).every(f => {
    const v = formData.value[f.name]
    return Array.isArray(v) ? v.length > 0 : v !== '' && v !== null && v !== undefined
  })
)

// ── Watchers ───────────────────────────────────────────────────────────────────
watch(() => props.modelValue, (open) => { if (open) { initializeForm(); errors.value = {}; apiError.value = '' } }, { immediate: true })
watch(() => props.initialData, () => { if (props.modelValue) initializeForm() }, { deep: true })

// ── Methods ────────────────────────────────────────────────────────────────────
function initializeForm() {
  const d = {}
  filePreview.value = {}
  props.fields.forEach(f => {
    if (props.mode === 'edit' && props.initialData[f.name] !== undefined) {
      d[f.name] = props.initialData[f.name]
      if (f.type === 'file' && props.initialData[f.name]) {
        const url = getExistingImageUrl(f)
        if (url) filePreview.value[f.name] = url
      }
    } else if (f.default !== undefined) {
      d[f.name] = f.default
    } else {
      d[f.name] = f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : (f.type === 'number' || f.type === 'range') ? (f.min ?? 0) : ''
    }
  })
  formData.value = d
}

function validateField(field) {
  const v = formData.value[field.name]
  if (field.required) {
    if ((Array.isArray(v) && !v.length) || (!v && v !== 0 && v !== false)) {
      errors.value[field.name] = `${field.label} is required`; return false
    }
  }
  if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    errors.value[field.name] = 'Invalid email format'; return false
  }
  if (field.type === 'url' && v) {
    try { new URL(v) } catch { errors.value[field.name] = 'Invalid URL format'; return false }
  }
  if (field.type === 'number' && v !== '') {
    if (field.min !== undefined && v < field.min) { errors.value[field.name] = `Minimum value is ${field.min}`; return false }
    if (field.max !== undefined && v > field.max) { errors.value[field.name] = `Maximum value is ${field.max}`; return false }
  }
  if (typeof field.validator === 'function') {
    const r = field.validator(v, formData.value)
    if (r !== true) { errors.value[field.name] = r; return false }
  }
  delete errors.value[field.name]; return true
}

function validateForm() {
  errors.value = {}
  let ok = true
  props.fields.forEach(f => { if (!f.hidden && !validateField(f)) ok = false })
  if (typeof props.customValidation === 'function') {
    const ce = props.customValidation(formData.value)
    if (ce && Object.keys(ce).length) { Object.assign(errors.value, ce); ok = false }
  }
  return ok
}

function handleFileChange(field, event) {
  const file = field.multiple ? Array.from(event.target.files) : event.target.files[0]
  formData.value[field.name] = file
  if (file && file.type?.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => { filePreview.value[field.name] = e.target.result }
    reader.readAsDataURL(file)
  }
}

function removeFilePreview(name) {
  formData.value[name] = null; filePreview.value[name] = null
  const el = document.querySelector(`input[type="file"]#${name}`)
  if (el) el.value = ''
}

function getExistingImageUrl(field) {
  const v = props.initialData[field.name]
  if (!v) return null
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  const base = (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_APP_BASE_URL : '') || process.env?.VUE_APP_BASE_URL || ''
  return `${base}/${v}`
}

function handleClose() { if (!loading.value) { emit('update:modelValue', false); emit('close') } }
function handleOverlayClick() { if (props.closeOnOverlay && !loading.value) { emit('cancel'); handleClose() } }
function handleSubmit() { handleConfirm() }

async function handleConfirm() {
  if (props.mode === 'delete') { await handleDelete(); return }
  if (props.mode === 'view') { handleClose(); return }
  if (!validateForm()) { apiError.value = 'Please fix the errors above.'; return }

  loading.value = true; apiError.value = ''
  try {
    let data = { ...formData.value }
    if (typeof props.transformData === 'function') data = props.transformData(data)

    const hasFiles = props.fields.some(f => f.type === 'file' && formData.value[f.name])
    if (hasFiles) {
      const fd = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return
        if (isFileObject(v)) { fd.append(k, v) }
        else if (Array.isArray(v) && v.length && isFileObject(v[0])) { v.forEach(f => fd.append(k, f)) }
        else if (Array.isArray(v)) { fd.append(k, JSON.stringify(v)) }
        else { fd.append(k, String(v)) }
      })
      data = fd
    }

    let response
    if (typeof props.onSubmit === 'function') {
      response = await props.onSubmit(data, props.mode, props.initialData)
    } else if (props.api) {
      const ep = props.mode === 'create' ? props.api.create : props.api.update
      const url = props.mode === 'edit' && props.initialData.id ? `${ep}/${props.initialData.id}` : ep
      response = await makeApiCall(url, props.mode === 'create' ? 'POST' : 'PUT', data)
    } else { throw new Error('No API configuration or onSubmit handler provided') }

    emit('submit', { data: response, mode: props.mode })
    emit('success', { data: response, mode: props.mode })
    if (props.autoClose) handleClose()
  } catch (err) {
    apiError.value = err.response?.data?.message || err.message || 'An error occurred'
    emit('error', { error: err, mode: props.mode })
  } finally { loading.value = false }
}

async function handleDelete() {
  loading.value = true; apiError.value = ''
  try {
    let response
    if (typeof props.onSubmit === 'function') {
      response = await props.onSubmit(props.initialData, 'delete')
    } else if (props.api?.delete) {
      const url = props.initialData.id ? `${props.api.delete}/${props.initialData.id}` : props.api.delete
      response = await makeApiCall(url, 'DELETE')
    } else { throw new Error('No API endpoint configured for delete mode') }

    emit('submit', { data: props.initialData, response, mode: 'delete' })
    emit('success', { data: props.initialData, response, mode: 'delete' })
    if (props.autoClose) handleClose()
  } catch (err) {
    apiError.value = err.response?.data?.message || err.message || 'An error occurred'
    emit('error', { error: err, mode: 'delete' })
  } finally { loading.value = false }
}

async function makeApiCall(url, method, data = null) {
  const opts = { method, headers: {} }
  if (data) {
    if (data instanceof FormData) { opts.body = data }
    else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data) }
  }
  const res = await fetch(url, opts)
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw { response: { data: e } } }
  return res.json()
}

const formatLabel = k => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()

const formatViewValue = (v, field) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof field.formatter === 'function') return field.formatter(v)
  switch (field.type) {
    case 'date': return new Date(v).toLocaleDateString()
    case 'datetime': return new Date(v).toLocaleString()
    case 'select':
    case 'radio': return field.options?.find(o => o.value === v)?.label ?? v
    default: return v
  }
}

const formatArrayItem = (item, field) =>
  field.type === 'multiselect' && field.options
    ? (field.options.find(o => o.value === item)?.label ?? item)
    : item

if (props.modelValue) initializeForm()
</script>

<style scoped>
/* ── Tokens (matches Sidebar / Login / Dashboard) ── */
.modal-overlay {
  --primary: #4338ca;
  --primary-hover: #3730a3;
  --primary-soft: #eef2ff;

  --danger: #dc2626;
  --danger-soft: #fef2f2;
  --danger-border: #fecaca;

  --success: #059669;
  --success-soft: #ecfdf5;
  --success-border: #a7f3d0;

  --info: #0284c7;
  --info-soft: #f0f9ff;
  --info-border: #bae6fd;

  --bg: #ffffff;
  --bg-soft: #f9fafb;
  --bg-elevated: #f3f4f6;

  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #9ca3af;

  --border: #e5e7eb;
  --border-strong: #d1d5db;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;

  --shadow-lg: 0 24px 48px -14px rgba(15, 23, 42, 0.22), 0 4px 12px -4px rgba(15, 23, 42, 0.08);
}

/* ── Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 24px;
  overflow-y: auto;
  backdrop-filter: blur(2px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif;
}

/* ── Box ── */
.modal-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.modal-box--small {
  max-width: 420px;
}

.modal-box--medium {
  max-width: 600px;
}

.modal-box--large {
  max-width: 820px;
}

.modal-box--xlarge {
  max-width: 1020px;
}

/* ── Header ── */
.modal-header {
  flex-shrink: 0;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.modal-header__rule {
  height: 3px;
  /* background: var(--primary); */
}

/* Mode-specific rule colour */
/* .rule--delete {
  background: var(--danger);
} */

/* .rule--view {
  background: var(--info);
} */

.modal-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  gap: 16px;
}

.modal-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

/* Mode mark */
.modal-mode-mark {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary);
  background: var(--primary-soft);
}

.modal-mode-mark svg {
  width: 17px;
  height: 17px;
}

.mode-mark--delete {
  color: var(--danger);
  background: var(--danger-soft);
}

.mode-mark--view {
  color: var(--info);
  background: var(--info-soft);
}

.modal-mode-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--text-muted);
  margin: 0 0 3px;
  line-height: 1;
  font-weight: 600;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Close button */
.modal-close {
  width: 32px;
  height: 32px;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  transition: color .14s, border-color .14s, background .14s;
}

.modal-close:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--border);
  background: var(--bg-soft);
}

.modal-close:disabled {
  opacity: .4;
  cursor: not-allowed;
}

.modal-close svg {
  width: 14px;
  height: 14px;
}

/* ── Body ── */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  color: var(--text-secondary);
}

.modal-body::-webkit-scrollbar {
  width: 5px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

/* ── DELETE zone ── */
.delete-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 8px 0;
}

.delete-zone__mark {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--danger-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--danger);
}

.delete-zone__mark svg {
  width: 24px;
  height: 24px;
}

.delete-zone__message {
  font-size: 14.5px;
  color: var(--text-primary);
  font-weight: 500;
  margin: 0;
}

.delete-zone__warning {
  font-size: 12.5px;
  color: var(--danger);
  font-weight: 600;
  margin: 0;
}

.entity-detail-grid {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-soft);
  margin-top: 8px;
  overflow: hidden;
}

.entity-detail-row {
  display: flex;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.entity-detail-row:last-child {
  border-bottom: none;
}

/* .entity-detail-key {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: var(--text-muted);
  font-weight: 600;
  min-width: 110px;
  flex-shrink: 0;
  padding-top: 1px;
} */

.entity-detail-val {
  font-size: 13.5px;
  color: var(--text-primary);
  word-break: break-word;
}

/* ── VIEW grid ── */
.view-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.view-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
  align-items: start;
}

.view-row:last-child {
  border-bottom: none;
}

.view-row__label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-muted);
  font-weight: 600;
  padding-top: 2px;
}

.view-row__value {
  font-size: 13.5px;
  color: var(--text-primary);
  word-break: break-word;
  line-height: 1.5;
}

.view-empty {
  color: var(--text-muted);
  font-size: 12.5px;
  font-style: italic;
}

.view-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.view-tag {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11.5px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
}

.bool-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 999px;
}

.bool-badge svg {
  width: 12px;
  height: 12px;
}

.bool-badge--yes {
  background: var(--success-soft);
  color: var(--success);
}

.bool-badge--no {
  background: var(--danger-soft);
  color: var(--danger);
}

.view-img-wrap {
  max-width: 100%;
}

.view-img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  display: block;
}

.view-file-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
  transition: color .14s;
}

.view-file-link:hover {
  color: var(--primary-hover);
}

.view-file-link svg {
  width: 15px;
  height: 15px;
}

/* ── Form ── */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--danger-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.form-alert svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 1px;
}

.form-alert--error {
  background: var(--danger-soft);
  color: #b91c1c;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group--hidden {
  display: none;
}

.form-group--error .form-input,
.form-group--error .form-select,
.form-group--error .form-textarea {
  border-color: var(--danger-border);
  background: var(--danger-soft);
}

.form-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}

.form-required {
  color: var(--danger);
}

.form-description {
  font-size: 11.5px;
  color: var(--text-muted);
}

/* shared input base */
.form-input,
.form-select,
.form-textarea,
.form-multiselect {
  width: 100%;
  box-sizing: border-box;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13.5px;
  padding: 10px 13px;
  outline: none;
  transition: border-color .15s, background .15s, box-shadow .15s;
  appearance: none;
  -webkit-appearance: none;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus,
.form-multiselect:focus {
  border-color: var(--primary);
  background: var(--bg);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.form-input:disabled,
.form-select:disabled,
.form-textarea:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.form-input[readonly],
.form-textarea[readonly] {
  opacity: .75;
}

.form-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input--icon {
  padding-left: 38px;
}

.form-input-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-pw-toggle {
  position: absolute;
  right: 10px;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: color .14s, background-color .14s;
}

.form-pw-toggle:hover {
  color: var(--primary);
  background: var(--primary-soft);
}

.form-pw-toggle svg {
  width: 15px;
  height: 15px;
}

.form-textarea {
  resize: vertical;
  min-height: 96px;
}

.form-select-wrap {
  position: relative;
}

.form-select {
  padding-right: 34px;
  cursor: pointer;
}

.form-select option {
  background: var(--bg);
  color: var(--text-primary);
}

.form-select-arrow {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--text-muted);
  pointer-events: none;
}

.form-multiselect {
  min-height: 100px;
  padding: 6px 10px;
}

.form-multiselect option {
  padding: 5px 8px;
  background: var(--bg);
  color: var(--text-secondary);
}

.form-multiselect option:checked {
  background: var(--primary-soft);
  color: var(--primary);
}

/* Checkbox */
.form-checkbox-input {
  display: none;
}

.form-checkbox-wrap {
  padding: 4px 0;
}

.form-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox-box {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  border-radius: 5px;
  border: 1.5px solid var(--border-strong);
  background: var(--bg);
  position: relative;
  transition: background .14s, border-color .14s;
}

.form-checkbox-input:checked+.form-checkbox-box {
  background: var(--primary);
  border-color: var(--primary);
}

.form-checkbox-input:checked+.form-checkbox-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border-right: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(45deg);
}

.form-checkbox-text {
  font-size: 13.5px;
  color: var(--text-secondary);
}

/* Radio */
.form-radio-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-top: 2px;
}

.form-radio-input {
  display: none;
}

.form-radio-label {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  user-select: none;
}

.form-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  background: var(--bg);
  flex-shrink: 0;
  position: relative;
  transition: border-color .14s;
}

.form-radio-input:checked+.form-radio-dot {
  border-color: var(--primary);
}

.form-radio-input:checked+.form-radio-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary);
}

.form-radio-text {
  font-size: 13.5px;
  color: var(--text-secondary);
}

/* File upload */
.form-file-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-file-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.form-file-preview__frame {
  width: 160px;
  height: 160px;
  border-radius: var(--radius-md);
  border: 1.5px dashed var(--border-strong);
  background: var(--bg-soft);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.form-file-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.form-file-preview__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.form-file-preview__empty svg {
  width: 26px;
  height: 26px;
}

.form-file-preview__empty span {
  font-size: 11.5px;
}

.form-file-preview__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: rgba(220, 38, 38, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity .14s;
  padding: 0;
}

.form-file-preview__frame:hover .form-file-preview__remove {
  opacity: 1;
}

.form-file-preview__remove svg {
  width: 12px;
  height: 12px;
}

.form-file-preview__label {
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 0;
}

.form-file-hidden {
  display: none;
}

.form-file-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  cursor: pointer;
  background: var(--bg-soft);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  transition: border-color .15s, color .15s, background .15s;
}

.form-file-btn:hover:not(.form-file-btn--disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.form-file-btn--disabled {
  opacity: .5;
  cursor: not-allowed;
}

.form-file-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Color */
.form-color-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-color-input {
  width: 42px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: none;
  cursor: pointer;
  padding: 2px;
}

.form-color-value {
  font-size: 12.5px;
  font-family: 'SFMono-Regular', 'Courier New', monospace;
  color: var(--text-secondary);
}

/* Range */
.form-range-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-range {
  flex: 1;
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: var(--border-strong);
  outline: none;
  cursor: pointer;
}

.form-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: box-shadow .14s;
}

.form-range::-webkit-slider-thumb:hover {
  box-shadow: 0 0 0 5px var(--primary-soft);
}

.form-range::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid #fff;
  cursor: pointer;
}

.form-range-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  min-width: 36px;
  text-align: right;
}

/* Field error */
.form-field-error {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--danger);
}

.form-field-error svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

/* ── Footer ── */
.modal-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  background: var(--bg-soft);
  border-top: 1px solid var(--border);
}

.modal-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 22px;
  min-width: 100px;
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s, box-shadow .15s, transform .12s;
  position: relative;
  overflow: hidden;
}

.modal-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.modal-btn:active:not(:disabled) {
  transform: scale(.98);
}

/* Cancel */
.modal-btn--cancel {
  background: var(--bg);
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.modal-btn--cancel:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-primary);
  background: var(--bg-elevated);
}

/* Primary (create/edit) */
.modal-btn--primary {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.modal-btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  box-shadow: 0 6px 16px -4px rgba(67, 56, 202, 0.4);
  transform: translateY(-1px);
}

/* Danger (delete) */
.modal-btn--danger {
  background: var(--danger-soft);
  border-color: var(--danger-border);
  color: var(--danger);
}

.modal-btn--danger:hover:not(:disabled) {
  background: var(--danger);
  border-color: var(--danger);
  color: #fff;
}

/* Ghost (view close) */
.modal-btn--ghost {
  background: var(--bg);
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.modal-btn--ghost:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

/* Spinner */
.modal-btn__busy {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-spinner {
  width: 15px;
  height: 15px;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Transitions ── */
.modal-enter-active {
  transition: opacity .22s ease;
}

.modal-leave-active {
  transition: opacity .16s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-box {
  transition: transform .22s cubic-bezier(.22, .68, 0, 1.2);
}

.modal-leave-active .modal-box {
  transition: transform .16s ease;
}

.modal-enter-from .modal-box {
  transform: scale(.96) translateY(8px);
}

.modal-leave-to .modal-box {
  transform: scale(.97);
}

.alert-enter-active {
  transition: max-height .2s ease, opacity .18s ease;
  max-height: 80px;
  overflow: hidden;
}

.alert-leave-active {
  transition: max-height .14s ease, opacity .12s ease;
}

.alert-enter-from,
.alert-leave-to {
  max-height: 0;
  opacity: 0;
}

.btn-text-enter-active {
  transition: opacity .14s ease, transform .14s ease;
}

.btn-text-leave-active {
  transition: opacity .1s ease;
}

.btn-text-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.btn-text-leave-to {
  opacity: 0;
}

/* ── Responsive ── */
@media (max-width:640px) {
  .modal-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .modal-box {
    max-width: 100%;
    max-height: 92vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-btn {
    width: 100%;
    justify-content: center;
  }

  .view-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .view-row__label {
    padding-top: 0;
  }
}
</style>