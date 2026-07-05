import { createApp } from 'vue'
import App from './App.vue'

import { useAppConfig } from '@/composables/useAppConfig'
import canDirective from '@/directives/can'
import { createPinia } from 'pinia'
import Router from './routes/'

/* Import the FontAwesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* Import FontAwesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* Import specific icons (solid, regular, and brand) */
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fas } from '@fortawesome/free-solid-svg-icons'

/* Add the imported icons to the library */
library.add(fas, far, fab);

const pinia = createPinia()

const initApp = async () => {
  // Fetch dynamic config before mounting
  
  const app = createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  app.use(pinia)
  app.directive('can', canDirective)
  app.use(Router)
  
  await useAppConfig()
  
  app.mount('#app')
}

initApp()