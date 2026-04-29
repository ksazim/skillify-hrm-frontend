import { defineStore } from 'pinia'

export const useAppConfigStore = defineStore('appConfig', {
  state: () => ({
    title: '',
    brand_name: '',
    tagline: '',
    logo_url: null,
    favicon_url: null,
    primary_color: '#4f46e5',
    secondary_color: '#10b981',
  }),
  actions: {
    setConfig(config) {
      this.title = config.title || ''
      this.brand_name = config.brand_name || ''
      this.tagline = config.tagline || ''
      this.logo_url = config.logo_url || null
      this.favicon_url = config.favicon || null
      this.primary_color = config.primary_color || '#4f46e5'
      this.secondary_color = config.secondary_color || '#10b981'
    }
  }
})