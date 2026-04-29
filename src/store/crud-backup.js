import { defineStore } from 'pinia';
import axios from 'axios';

/**
 * CRUD Store - Handles all CRUD operations with centralized API calls
 * @module stores/crud
 */
export const useCrudStore = defineStore('crud', {
  state: () => ({
    // Data collections
    items: [],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    },
    
    // Single item data
    currentItem: null,
    currentPhoto: null,
    
    // Loading and error states
    loading: false,
    error: null
  }),

  getters: {
    /**
     * Get all items
     */
    getAllItems: (state) => state.items,

    /**
     * Get pagination info
     */
    getPagination: (state) => state.pagination,

    /**
     * Get current item
     */
    getCurrentItem: (state) => state.currentItem,

    /**
     * Get current photo
     */
    getCurrentPhoto: (state) => state.currentPhoto,

    /**
     * Check if data is loading
     */
    isLoading: (state) => state.loading,

    /**
     * Get error state
     */
    getError: (state) => state.error,

    /**
     * Check if there's an error
     */
    hasError: (state) => state.error !== null
  },

  actions: {
    /**
     * Set up axios with authentication token
     * @private
     */
    _setupAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },

    /**
     * Build full API URL
     * @private
     * @param {string} endpoint - API endpoint
     * @returns {string} Full API URL
     */
    _buildUrl(endpoint) {
      const baseUrl = process.env.VUE_APP_BASE_API;
      // Remove leading slash from endpoint if exists
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      // Ensure base URL ends with slash
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      return `${cleanBaseUrl}${cleanEndpoint}`;
    },

    /**
     * Extract photo from item data
     * @private
     * @param {Object} item - Item data
     * @returns {string|null} Photo URL or null
     */
    _extractPhoto(item) {
      if (!item) return null;

      // Check direct media
      if (item.media && Array.isArray(item.media) && item.media.length > 0) {
        const media = item.media[0];
        return media.base_path && media.file_name 
          ? `${media.base_path}/${media.file_name}` 
          : null;
      }

      // Check product media
      if (item.product?.media && Array.isArray(item.product.media) && item.product.media.length > 0) {
        const media = item.product.media[0];
        return media.base_path && media.file_name 
          ? `${media.base_path}/${media.file_name}` 
          : null;
      }

      return null;
    },

    /**
     * Handle API errors
     * @private
     * @param {Error} error - Error object
     * @returns {Object} Formatted error
     */
    _handleError(error) {
      this.loading = false;

      let formattedError = {
        message: 'An unexpected error occurred',
        status: null,
        data: null,
        errors: null
      };

      if (error.response) {
        // Server responded with error status
        formattedError = {
          message: error.response.data?.message || error.message || 'Server error occurred',
          status: error.response.status,
          data: error.response.data,
          errors: error.response.data?.errors || null
        };
      } else if (error.request) {
        // Request made but no response
        formattedError = {
          message: 'No response from server. Please check your connection.',
          status: null,
          data: null,
          errors: null
        };
      } else {
        // Error in request setup
        formattedError = {
          message: error.message || 'Failed to make request',
          status: null,
          data: null,
          errors: null
        };
      }

      this.error = formattedError;
      console.error('CRUD Store Error:', formattedError);
      
      return formattedError;
    },

    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
    },

    /**
     * Fetch all items with pagination
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async fetchAll(endpoint, params = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        const response = await axios.get(this._buildUrl(endpoint), { params });
        
        // Handle response data structure
        if (response.data) {
          this.items = response.data.list || response.data.data || response.data || [];
          
          // Handle pagination
          if (response.data.pagination) {
            this.pagination = {
              currentPage: response.data.pagination.current_page || 1,
              totalPages: response.data.pagination.total_pages || 1,
              totalItems: response.data.pagination.total || 0,
              itemsPerPage: response.data.pagination.per_page || 10
            };
          }
        }

        this.loading = false;

        return {
          success: true,
          data: response.data,
          items: this.items,
          pagination: this.pagination
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Fetch list without pagination (for dropdowns, etc.)
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async fetchList(endpoint, params = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        const response = await axios.get(this._buildUrl(endpoint), { params });
        
        this.loading = false;

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Fetch single item by ID
     * @param {string} endpoint - API endpoint
     * @param {string|number} id - Item ID
     * @returns {Promise<Object>} Response data
     */
    async fetchById(endpoint, id) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        const url = `${this._buildUrl(endpoint)}${id}`;
        const response = await axios.get(url);
        
        this.currentItem = response.data;
        this.currentPhoto = this._extractPhoto(response.data);
        
        this.loading = false;

        return {
          success: true,
          data: response.data,
          photo: this.currentPhoto
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Create new item
     * @param {string} endpoint - API endpoint
     * @param {Object|FormData} data - Item data
     * @param {Object} config - Axios config
     * @returns {Promise<Object>} Response data
     */
    async create(endpoint, data, config = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        // Set default config for FormData
        if (data instanceof FormData && !config.headers) {
          config.headers = {
            'Content-Type': 'multipart/form-data'
          };
        }

        const response = await axios.post(this._buildUrl(endpoint), data, config);
        
        this.loading = false;

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data?.message || 'Item created successfully'
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Update existing item
     * @param {string} endpoint - API endpoint
     * @param {Object|FormData} data - Item data (must include id)
     * @param {Object} config - Axios config
     * @returns {Promise<Object>} Response data
     */
    async update(endpoint, data, config = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();

        // Extract ID from data
        let id;
        if (data instanceof FormData) {
          id = data.get('id');
          config.headers = {
            'Content-Type': 'multipart/form-data',
            ...config.headers
          };
        } else {
          id = data.id;
        }

        if (!id) {
          throw new Error('Item ID is required for update operation');
        }

        const url = `${this._buildUrl(endpoint)}/${id}`;
        const response = await axios.put(url, data, config);
        
        this.loading = false;

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data?.message || 'Item updated successfully'
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Partially update existing item
     * @param {string} endpoint - API endpoint
     * @param {string|number} id - Item ID
     * @param {Object} data - Partial item data
     * @param {Object} config - Axios config
     * @returns {Promise<Object>} Response data
     */
    async patch(endpoint, id, data, config = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();

        const url = `${this._buildUrl(endpoint)}/${id}`;
        const response = await axios.patch(url, data, config);
        
        this.loading = false;

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data?.message || 'Item updated successfully'
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Delete item by ID
     * @param {string} endpoint - API endpoint
     * @param {string|number} id - Item ID
     * @returns {Promise<Object>} Response data
     */
    async delete(endpoint, id) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();

        const url = `${this._buildUrl(endpoint)}${id}`;
        const response = await axios.delete(url);
        
        this.loading = false;

        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data?.message || 'Item deleted successfully'
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Generic GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} Response data
     */
    async get(endpoint, params = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        const response = await axios.get(this._buildUrl(endpoint), { params });
        
        this.loading = false;

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Generic POST request
     * @param {string} endpoint - API endpoint
     * @param {Object|FormData} data - Request data
     * @param {Object} config - Axios config
     * @returns {Promise<Object>} Response data
     */
    async post(endpoint, data, config = {}) {
      this.loading = true;
      this.error = null;

      try {
        this._setupAuth();
        
        if (data instanceof FormData && !config.headers) {
          config.headers = {
            'Content-Type': 'multipart/form-data'
          };
        }

        const response = await axios.post(this._buildUrl(endpoint), data, config);
        
        this.loading = false;

        return {
          success: true,
          data: response.data
        };
      } catch (error) {
        const formattedError = this._handleError(error);
        return {
          success: false,
          error: formattedError
        };
      }
    },

    /**
     * Clear current item data
     */
    clearCurrentItem() {
      this.currentItem = null;
      this.currentPhoto = null;
      this.error = null;
    },

    /**
     * Clear all store data
     */
    clearAll() {
      this.items = [];
      this.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
      };
      this.currentItem = null;
      this.currentPhoto = null;
      this.error = null;
      this.loading = false;
    },

    /**
     * Reset store to initial state
     */
    $reset() {
      this.clearAll();
    }
  }
});