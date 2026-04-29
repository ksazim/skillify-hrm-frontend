import { createApp } from 'vue'
import App from './App.vue'

import Router from './routes/'
import { createPinia } from 'pinia'
import { useAppConfig } from '@/composables/useAppConfig'

/* Import the FontAwesome core */
import { library } from '@fortawesome/fontawesome-svg-core';

/* Import FontAwesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* Import specific icons (solid, regular, and brand) */
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

/* Add the imported icons to the library */
library.add(fas, far, fab);

const pinia = createPinia()

const initApp = async () => {
  // Fetch dynamic config before mounting
  
  const app = createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  app.use(pinia)
  app.use(Router)
  
  await useAppConfig()
  
  app.mount('#app')
}

initApp()