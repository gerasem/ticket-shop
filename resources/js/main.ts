import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import App from './App.vue'
import router from './router'

import '../css/app.scss'
import './style.scss'
import './assets/venue.scss'

import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(Toast, {
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  position: 'top-right',
})

const authStore = useAuthStore()
authStore.checkAuth().then(() => {
    app.use(router)
    app.mount('#app')
})
