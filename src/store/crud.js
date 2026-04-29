import { defineStore } from 'pinia';
import axios from 'axios';

export const useCrudStore = defineStore('crud', {
  state: () => ({
    items: [],
    pagination: {
      currentPage:  1,
      totalPages:   1,
      totalItems:   0,   // ← always a plain integer (server total across ALL pages)
      itemsPerPage: 10
    },
    currentItem:  null,
    currentPhoto: null,
    loading:      false,
    error:        null
  }),

  getters: {
    getAllItems:   (state) => state.items,

    /**
     * FIX: expose pagination so every module can read
     *   crudStore.getPagination.totalItems   ← real server total
     * instead of using items.length (= only the current page).
     */
    getPagination: (state) => state.pagination,

    getCurrentItem:  (state) => state.currentItem,
    getCurrentPhoto: (state) => state.currentPhoto,
    isLoading:       (state) => state.loading,
    getError:        (state) => state.error,
    hasError:        (state) => state.error !== null
  },

  actions: {
    _setupAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    },

    _buildUrl(endpoint) {
      const baseUrl      = process.env.VUE_APP_BASE_API;
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const cleanBaseUrl  = baseUrl.endsWith('/')    ? baseUrl            : `${baseUrl}/`;
      return `${cleanBaseUrl}${cleanEndpoint}`;
    },

    _extractPhoto(item) {
      if (!item) return null;
      if (item.media?.length) {
        const m = item.media[0];
        return m.base_path && m.file_name ? `${m.base_path}/${m.file_name}` : null;
      }
      if (item.product?.media?.length) {
        const m = item.product.media[0];
        return m.base_path && m.file_name ? `${m.base_path}/${m.file_name}` : null;
      }
      return null;
    },

    _handleError(error) {
      this.loading = false;
      let formatted = {
        message: 'An unexpected error occurred',
        status:  null,
        data:    null,
        errors:  null,
        response: error.response ?? null   // keep raw response for field-level errors
      };
      if (error.response) {
        formatted = {
          ...formatted,
          message: error.response.data?.message || error.message || 'Server error occurred',
          status:  error.response.status,
          data:    error.response.data,
          errors:  error.response.data?.errors || null
        };
      } else if (error.request) {
        formatted.message = 'No response from server. Please check your connection.';
      } else {
        formatted.message = error.message || 'Failed to make request';
      }
      this.error = formatted;
      console.error('CRUD Store Error:', formatted);
      return formatted;
    },

    clearError() { this.error = null; },

    /**
     * Fetch paginated list.
     *
     * FIX: pagination.totalItems is always set to a plain integer.
     * All modules must pass :total-items="crudStore.getPagination.totalItems"
     * to <Pagination> — never items.length which is just the current page slice.
     */
    async fetchAll(endpoint, params = {}) {
      this.loading = true;
      this.error   = null;

      try {
        this._setupAuth();
        const response = await axios.get(this._buildUrl(endpoint), { params });

        if (response.data) {
          this.items = response.data.list || response.data.data || response.data || [];

          if (response.data.pagination) {
            const p = response.data.pagination;
            this.pagination = {
              currentPage:  Number(p.current_page) || 1,
              totalPages:   Number(p.total_pages)  || 1,
              // Always coerce to integer — prevents "Unsupported operand types" on
              // the next request if this value were accidentally fed back as a string.
              totalItems:   Number(p.total)        || 0,
              itemsPerPage: Number(p.per_page)     || 10
            };
          } else {
            // No pagination envelope — treat entire response as the full list
            const len = Array.isArray(this.items) ? this.items.length : 0;
            this.pagination = {
              currentPage:  1,
              totalPages:   1,
              totalItems:   len,
              itemsPerPage: len
            };
          }
        }

        this.loading = false;
        return {
          success:    true,
          data:       response.data,
          items:      this.items,
          pagination: this.pagination
        };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async fetchList(endpoint, params = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        const response = await axios.get(this._buildUrl(endpoint), { params });
        this.loading = false;
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async fetchById(endpoint, id) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        const url      = `${this._buildUrl(endpoint)}${id}`;
        const response = await axios.get(url);
        this.currentItem  = response.data;
        this.currentPhoto = this._extractPhoto(response.data);
        this.loading = false;
        return { success: true, data: response.data, photo: this.currentPhoto };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async create(endpoint, data, config = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        if (data instanceof FormData && !config.headers) {
          config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        const response = await axios.post(this._buildUrl(endpoint), data, config);
        this.loading = false;
        return {
          success: true,
          data:    response.data.data || response.data,
          message: response.data?.message || 'Item created successfully'
        };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async update(endpoint, data, config = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        let id;
        if (data instanceof FormData) {
          id = data.get('id');
          config.headers = { 'Content-Type': 'multipart/form-data', ...config.headers };
        } else {
          id = data.id;
        }
        if (!id) throw new Error('Item ID is required for update operation');
        const url      = `${this._buildUrl(endpoint)}/${id}`;
        const response = await axios.put(url, data, config);
        this.loading = false;
        return {
          success: true,
          data:    response.data.data || response.data,
          message: response.data?.message || 'Item updated successfully'
        };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async patch(endpoint, id, data, config = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        const url      = `${this._buildUrl(endpoint)}/${id}`;
        const response = await axios.patch(url, data, config);
        this.loading = false;
        return {
          success: true,
          data:    response.data.data || response.data,
          message: response.data?.message || 'Item updated successfully'
        };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async delete(endpoint, id) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        const url      = `${this._buildUrl(endpoint)}${id}`;
        const response = await axios.delete(url);
        this.loading = false;
        return {
          success: true,
          data:    response.data.data || response.data,
          message: response.data?.message || 'Item deleted successfully'
        };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async get(endpoint, params = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        const response = await axios.get(this._buildUrl(endpoint), { params });
        this.loading = false;
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    async post(endpoint, data, config = {}) {
      this.loading = true;
      this.error   = null;
      try {
        this._setupAuth();
        if (data instanceof FormData && !config.headers) {
          config.headers = { 'Content-Type': 'multipart/form-data' };
        }
        const response = await axios.post(this._buildUrl(endpoint), data, config);
        this.loading = false;
        return { success: true, data: response.data };
      } catch (error) {
        return { success: false, error: this._handleError(error) };
      }
    },

    clearCurrentItem() {
      this.currentItem  = null;
      this.currentPhoto = null;
      this.error        = null;
    },

    clearAll() {
      this.items        = [];
      this.pagination   = { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 10 };
      this.currentItem  = null;
      this.currentPhoto = null;
      this.error        = null;
      this.loading      = false;
    },

    $reset() { this.clearAll(); }
  }
});