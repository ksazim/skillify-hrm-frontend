import { useAuthStore } from '@/store/auth'
import { watchEffect } from 'vue'

export default {
  mounted(el, binding) {
    const store = useAuthStore()

    watchEffect(() => {
      const allowed = store.permissions.includes(binding.value)

      if (!allowed) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    })
  }
}