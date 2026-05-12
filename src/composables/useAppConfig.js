import { useAppConfigStore } from '@/store/appConfig'

export const useAppConfig = async () => {
  try {
    // MOCK: Use mock system data for testing without backend
    const system = {
      brand_name: 'Nexara',
      logo: null,
      favicon: null,
      primary_color: '#4f46e5',
      secondary_color: '#10b981',
      tagline: 'Human Resources'
    }

    const storageBase = process.env.VUE_APP_BASE_URL // e.g. https://yourdomain.com/storage/

    const config = {
      title: system.brand_name || 'App',
      logo_url: system.logo ? storageBase + system.logo : null,
      favicon_url: system.favicon ? storageBase + '/' + system.favicon : null,
      primary_color: system.primary_color || '#4f46e5',
      secondary_color: system.secondary_color || '#10b981',
      brand_name: system.brand_name || 'App',
      tagline: system.tagline || '',
    }

    // Save to Pinia store
    const appConfigStore = useAppConfigStore()
    appConfigStore.setConfig(config)

    // Set document title
    if (config.title) {
      document.title = config.title
    }

    // Set favicon
    if (config.favicon_url) {
      const favicon = document.querySelector("link[rel='icon']")
      if (favicon) {
        favicon.href = config.favicon_url
      } else {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = config.favicon_url
        document.head.appendChild(link)
      }
    }

    return config
  } catch (error) {
    console.error('Failed to load app config:', error)
    return null
  }
}