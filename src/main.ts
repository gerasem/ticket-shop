import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './style.css' // Assuming default style file or we will create one
import './assets/venue.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
