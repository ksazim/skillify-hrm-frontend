import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    token: localStorage.getItem('token'),
    user: {},
    permissions: [],
    roles: []
  }),

  actions: {
    async getUser() {
      if (!this.token) {
        this.isAuthenticated = false
        return
      }
      await this.fetchUser()
    },

    async fetchUser() {
      try {
        const baseApi = process.env.VUE_APP_BASE_API
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        const res = await axios.get(`${baseApi}/user`)
        this.user        = res.data.user
        this.permissions = res.data.permissions
        this.roles       = res.data.roles
        this.isAuthenticated = true
      } catch (error) {
        if (error.response?.status === 401) {
          this.isAuthenticated = false
          this.user        = {}
          this.permissions = []
          this.roles       = []
          localStorage.removeItem('token')
        }
      }
    },

    async changePass(api, data) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        return await axios.post(process.env.VUE_APP_BASE_API_URL + api, data)
      } catch(e) {
        return e
      }
    },

    login(token) {
      this.token = token
      localStorage.setItem('token', token)
      this.fetchUser()
    },

    logout() {
      axios.get(process.env.VUE_APP_BASE_API_URL + 'logout').then(() => {
        this.isAuthenticated = false
        this.user        = {}
        this.permissions = []
        this.roles       = []
        this.token       = null
        localStorage.removeItem('token')
      })
    },
  },
})