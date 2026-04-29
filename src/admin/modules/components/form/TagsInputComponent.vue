<template>
  <div class="tags-input-wrapper" :class="{ focused }" @click="inputRef?.focus()">
    <div class="tags-list">
      <span v-for="(tag, i) in modelValue" :key="i" class="tag-item">
        {{ tag }}
        <button type="button" class="tag-remove" @click.stop="removeTag(i)">×</button>
      </span>
      <input
        ref="inputRef"
        v-model="inputVal"
        class="tags-input"
        :placeholder="modelValue.length === 0 ? placeholder : 'Add more...'"
        @keydown="handleKeydown"
        @focus="focused = true"
        @blur="handleBlur"
      />
    </div>
    <p class="tags-hint">Press <kbd>Enter</kbd> or <kbd>,</kbd> to add</p>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue:  { type: Array,  default: () => [] },
  placeholder: { type: String, default: 'Type and press Enter...' }
})

const emit = defineEmits(['update:modelValue'])

const inputVal = ref('')
const focused  = ref(false)
const inputRef = ref(null)

const addTag = () => {
  const val = inputVal.value.replace(/,/g, '').trim()
  if (val && !props.modelValue.includes(val)) {
    emit('update:modelValue', [...props.modelValue, val])
  }
  inputVal.value = ''
}

const removeTag = (index) => {
  const updated = [...props.modelValue]
  updated.splice(index, 1)
  emit('update:modelValue', updated)
}

const handleKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addTag()
  } else if (e.key === 'Backspace' && inputVal.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue.length - 1)
  }
}

const handleBlur = () => {
  focused.value = false
  if (inputVal.value.trim()) addTag()
}
</script>

<style scoped>
.tags-input-wrapper {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  background: white;
  cursor: text;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 44px;
}
.tags-input-wrapper.focused {
  border-color: #1E40AF;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #EFF6FF;
  color: #1E40AF;
  border: 1px solid #DBEAFE;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.tag-remove {
  background: none;
  border: none;
  color: #1E40AF;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}
.tag-remove:hover { opacity: 1; }
.tags-input {
  border: none;
  outline: none;
  font-size: 14px;
  color: #374151;
  min-width: 140px;
  flex: 1;
  padding: 2px 0;
  background: transparent;
  /* Ensure input is always visible */
  display: inline-block;
  height: 28px;
}
.tags-hint {
  font-size: 11px;
  color: #9CA3AF;
  margin: 6px 0 0;
}
.tags-hint kbd {
  background: #F3F4F6;
  border: 1px solid #D1D5DB;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
}
</style>