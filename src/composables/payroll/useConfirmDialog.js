import { ref } from 'vue'

/**
 * useConfirmDialog
 * ─────────────────
 * Generic "are you sure?" dialog state. The original component
 * had two near-identical confirm flows (mark-paid, delete) that
 * both just populated the same `confirmData` shape and ran a
 * callback. This composable is that same pattern, reusable.
 */
export function useConfirmDialog() {
  const isOpen = ref(false)
  const data   = ref({ title: '', message: '', action: '', danger: false, fn: null })

  const open = ({ title, message, action, danger = false, fn }) => {
    data.value = { title, message, action, danger, fn }
    isOpen.value = true
  }

  const close = () => { isOpen.value = false }

  const confirm = () => {
    data.value.fn?.()
    isOpen.value = false
  }

  return { isOpen, data, open, close, confirm }
}
