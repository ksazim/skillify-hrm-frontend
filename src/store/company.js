import { defineStore } from 'pinia';

export const useCompanyStore = defineStore('company', {
  state: () => ({
    company_id: 0,
  }),
});