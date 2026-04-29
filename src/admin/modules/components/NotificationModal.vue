<template>
  <Teleport to="body">
    <Transition name="notification">
      <div v-if="modelValue" class="notification-overlay" @click="handleOverlayClick">
        <div class="notification-container" :class="[typeClass, sizeClass]">
          <!-- Icon -->
          <div class="notification-icon">
            <span class="icon-circle" :class="typeClass">
              {{ iconSymbol }}
            </span>
          </div>

          <!-- Content -->
          <div class="notification-content">
            <h3 class="notification-title">{{ computedTitle }}</h3>
            <p class="notification-message">{{ message }}</p>
            
            <!-- Additional details (optional) -->
            <div v-if="details" class="notification-details">
              <p>{{ details }}</p>
            </div>

            <!-- List of items (optional) -->
            <ul v-if="list && list.length > 0" class="notification-list">
              <li v-for="(item, index) in list" :key="index">{{ item }}</li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="notification-actions">
            <button 
              v-if="showCancel"
              type="button"
              class="notification-btn btn-cancel"
              @click="handleCancel"
              :disabled="loading"
            >
              {{ cancelLabel }}
            </button>
            <button 
              type="button"
              :class="['notification-btn', confirmButtonClass]"
              @click="handleConfirm"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
              {{ loading ? 'Processing...' : confirmLabel }}
            </button>
          </div>

          <!-- Close button (X) -->
          <button 
            v-if="showCloseButton"
            class="notification-close" 
            @click="handleClose"
            :disabled="loading"
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue';

const props = defineProps({
  // Modal visibility (v-model)
  modelValue: {
    type: Boolean,
    required: true
  },

  // Type: 'success', 'error', 'warning', 'info'
  type: {
    type: String,
    required: true,
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },

  // Title (optional, auto-generated if not provided)
  title: {
    type: String,
    default: ''
  },

  // Message content
  message: {
    type: String,
    required: true
  },

  // Additional details (optional)
  details: {
    type: String,
    default: ''
  },

  // List of items (optional)
  list: {
    type: Array,
    default: () => []
  },

  // Confirm button label
  confirmLabel: {
    type: String,
    default: 'OK'
  },

  // Cancel button label
  cancelLabel: {
    type: String,
    default: 'Cancel'
  },

  // Show cancel button
  showCancel: {
    type: Boolean,
    default: false
  },

  // Show close button (X)
  showCloseButton: {
    type: Boolean,
    default: true
  },

  // Modal size
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },

  // Close on overlay click
  closeOnOverlay: {
    type: Boolean,
    default: true
  },

  // Auto close after duration (milliseconds, 0 = disabled)
  autoClose: {
    type: Number,
    default: 0
  },

  // Loading state
  loading: {
    type: Boolean,
    default: false
  },

  // Custom confirm handler
  onConfirm: {
    type: Function,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close']);

// Computed properties
const computedTitle = computed(() => {
  if (props.title) return props.title;
  
  switch (props.type) {
    case 'success':
      return 'Success!';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
      return 'Information';
    default:
      return 'Notification';
  }
});

const iconSymbol = computed(() => {
  switch (props.type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '!';
    case 'info':
      return 'i';
    default:
      return '?';
  }
});

const typeClass = computed(() => {
  return `notification-${props.type}`;
});

const sizeClass = computed(() => {
  return `notification-${props.size}`;
});

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'btn-success';
    case 'error':
      return 'btn-danger';
    case 'warning':
      return 'btn-warning';
    case 'info':
      return 'btn-info';
    default:
      return 'btn-primary';
  }
});

// Auto close
if (props.autoClose > 0) {
  setTimeout(() => {
    if (props.modelValue) {
      handleClose();
    }
  }, props.autoClose);
}

// Methods
const handleClose = () => {
  if (!props.loading) {
    emit('update:modelValue', false);
    emit('close');
  }
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay && !props.loading) {
    handleClose();
  }
};

const handleConfirm = async () => {
  if (props.onConfirm && typeof props.onConfirm === 'function') {
    try {
      await props.onConfirm();
    } catch (error) {
      console.error('Confirm handler error:', error);
    }
  }
  
  emit('confirm');
  
  if (!props.loading) {
    handleClose();
  }
};

const handleCancel = () => {
  if (!props.loading) {
    emit('cancel');
    handleClose();
  }
};
</script>

<style scoped>
/* Overlay */
.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* Container */
.notification-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 30px 30px;
  position: relative;
  width: 100%;
}

.notification-small {
  max-width: 400px;
}

.notification-medium {
  max-width: 500px;
}

.notification-large {
  max-width: 600px;
}

/* Close Button (X) */
.notification-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.notification-close:hover:not(:disabled) {
  background: #f8f9fa;
  color: #333;
}

.notification-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Icon */
.notification-icon {
  margin-bottom: 20px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  color: white;
}

.icon-circle.notification-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.icon-circle.notification-error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.icon-circle.notification-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
}

.icon-circle.notification-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
}

/* Content */
.notification-content {
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
}

.notification-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #333;
}

.notification-success .notification-title {
  color: #28a745;
}

.notification-error .notification-title {
  color: #dc3545;
}

.notification-warning .notification-title {
  color: #856404;
}

.notification-info .notification-title {
  color: #17a2b8;
}

.notification-message {
  font-size: 16px;
  color: #495057;
  margin: 0;
  line-height: 1.6;
}

.notification-details {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #6c757d;
  text-align: left;
}

.notification-list {
  margin-top: 16px;
  padding-left: 24px;
  text-align: left;
  color: #495057;
}

.notification-list li {
  margin: 8px 0;
  font-size: 14px;
}

/* Actions */
.notification-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

.notification-btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
}

.notification-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.btn-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #333;
}

.btn-warning:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
}

.btn-info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
  color: white;
}

.btn-info:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.4);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Spinner */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Transitions */
.notification-enter-active,
.notification-leave-active {
  transition: opacity 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
}

.notification-enter-active .notification-container,
.notification-leave-active .notification-container {
  transition: transform 0.3s ease;
}

.notification-enter-from .notification-container {
  transform: scale(0.9) translateY(-20px);
}

.notification-leave-to .notification-container {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .notification-container {
    padding: 30px 20px 20px;
  }

  .icon-circle {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .notification-title {
    font-size: 20px;
  }

  .notification-message {
    font-size: 15px;
  }

  .notification-actions {
    flex-direction: column;
    width: 100%;
  }

  .notification-btn {
    width: 100%;
  }
}
</style>