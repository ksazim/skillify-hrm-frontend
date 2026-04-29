import { defineStore } from 'pinia';
// import axios from 'axios'

export const usePaginationStore = defineStore({
    id: 'pagination',
    state: () => ({
        allCategory: [],
        itemPerPage: 10,
        pageNo: ''
    }),
    actions: {
      
    }
});