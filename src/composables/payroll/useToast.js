import { ref } from 'vue'

/**
 * useToast
 * ─────────
 * Same behavior as the original inline toast (3.5s auto-dismiss,
 * success/error types) — just made reusable so any component
 * can trigger a toast without prop-drilling.
 */
export function useToast() {
  const toast = ref({ visible: false, message: '', type: 'success' })
  let timer = null

  const showToast = (message, type = 'success') => {
    clearTimeout(timer)
    toast.value = { visible: true, message, type }
    timer = setTimeout(() => { toast.value.visible = false }, 3500)
  }

  return { toast, showToast }
}
