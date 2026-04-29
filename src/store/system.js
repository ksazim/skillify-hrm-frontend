import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from './auth'

export const useSystemStore = defineStore('system', {
  state: () => ({
    serverPath: process.env.VUE_APP_BASE_SERVER_URL,
    openSidebar: false,
    loggedIn: localStorage.getItem('token'),
    token: localStorage.getItem('token'),
    user: {},
    userProfile: {},
    
    fileUploadUrl: '',
    loading: true,

    modalOn: false,
    showSidebar: true,
  }),

  getters: {
    
  },

  actions: {
    async getUserProfile() {
      const authStore = useAuthStore()
      axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
      await axios.get(process.env.VUE_APP_BASE_API_URL+'profile').then((response) => {
        this.userProfile = response.data.data
      }).catch((errors) => {
        if(errors.status == 401) {
          this.userProfile = null
        }
      })
    },

    async getProductList(id) {
      const authStore = useAuthStore()
      axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
      await axios.get(process.env.VUE_APP_BASE_API_URL+'areas/'+id).then((response) => {
        this.products = response.data.list
      }).catch((errors) => {
        if(errors.status == 401) {
          this.products = null
        }
      })
    },

    async getCustomerList(id) {
      const authStore = useAuthStore()
      axios.defaults.headers.common['Authorization'] = `Bearer ${authStore.token}`
      await axios.get(process.env.VUE_APP_BASE_API_URL+'areas/'+id).then((response) => {
        this.customers = response.data.list
      }).catch((errors) => {
        if(errors.status == 401) {
          this.customers = null
        }
      })
    },
  }   
})
