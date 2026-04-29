import { defineStore } from 'pinia';

export const useCommonStore = defineStore('common', {
  state: () => ({
    loading: false,
    error: null,
    notification: {
      show: false,
      type: 'info',
      message: '',
      title: ''
    }
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => state.error !== null,
    getError: (state) => state.error
  },

  actions: {
    setLoading(value) {
      this.loading = value;
    },

    setError(error) {
      this.error = error;
      this.loading = false;
    },

    clearError() {
      this.error = null;
    },

    showNotification(type, message, title = '') {
      this.notification = {
        show: true,
        type,
        message,
        title
      };
    },

    hideNotification() {
      this.notification.show = false;
    },

    $reset() {
      this.loading = false;
      this.error = null;
      this.notification = {
        show: false,
        type: 'info',
        message: '',
        title: ''
      };
    }
  }
});