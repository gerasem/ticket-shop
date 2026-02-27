import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import '../css/app.scss' // Tailwind CSS
import './style.scss' // Assuming default style file or we will create one
import './assets/venue.scss'

import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())

const authStore = useAuthStore()
authStore.checkAuth().then(() => {
    app.use(router)
    app.mount('#app')
})
