<template>
  <div
    class="avatar-initials"
    :class="`avatar-initials--${size}`"
    :style="{ background: avatarBg(name) }"
  >
    {{ initials(name) }}
  </div>
</template>

<script setup>
import { initials, avatarBg } from '@/utils/formatters'

defineProps({
  name: { type: String, default: '' },
  size: { type: String, default: 'md' } // 'sm' | 'md' | 'lg'
})
</script>

<style scoped>
.avatar-initials {
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 0 2px #fff, 0 1px 2px rgba(15, 23, 42, 0.08);
}
.avatar-initials--sm { width: 28px; height: 28px; font-size: 10px; }
.avatar-initials--md { width: 34px; height: 34px; font-size: 12px; }
.avatar-initials--lg { width: 44px; height: 44px; font-size: 14px; }
</style>
