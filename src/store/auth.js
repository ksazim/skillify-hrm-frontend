// stores/auth.js
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false, // Authentication status
    isUser: false, // User's role (user)
    isAgent: false, // User's role (agent)
    token: localStorage.getItem('token'), // Token from localStorage
    user: {}
  }),
  
  actions: {
    async getUser() {
      if (!this.token) {
        this.isAuthenticated = false;
        return;
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      
      try {
        const response = await axios.get(process.env.VUE_APP_BASE_API_URL + 'user');
        
        this.user = response.data.user;
        
        if (this.user.roleId === 3) {
          this.isAgent = false;
          this.isUser = true;
        } else if (this.user.roleId === 4) {
          this.isUser = false;
          this.isAgent = true;
        }

        this.isAuthenticated = true;
      } catch (error) {
        if (error.response && error.response.status === 401) {
          this.isAuthenticated = false;
          this.user = {}; // Clear user data
          localStorage.removeItem('token'); // Remove token from localStorage
        } else {
          console.error('An error occurred while fetching user data:', error);
        }
      }
    },

    async changePass(api, data) {
      try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          return await axios.post(process.env.VUE_APP_BASE_API_URL+api, data)
      } catch(e) {
          return await e
      }
    },
    
    // Additional method to logout and reset state
    logout() {
      axios.get(process.env.VUE_APP_BASE_API_URL+'logout').then(() => {
        this.isAuthenticated = false;
        this.isUser = false;
        this.isAgent = false;
        this.user = {};
        this.token = null;
        localStorage.removeItem('token')
      })
    },
    
    // Method to login (set token and get user)
    login(token) {
      this.token = token;
      localStorage.setItem('token', token); // Store token in localStorage
      this.getUser(); // Fetch user data after login
    },
  },
});
