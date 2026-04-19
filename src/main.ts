import './assets/main.css'
import 'element-plus/dist/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import { useCityStore } from './store/city'

const app = createApp(App);
const pinia = createPinia()

app.use(pinia);
//全局注册ElementPlus
app.use(ElementPlus);
app.use(router);

const authStore = useAuthStore(pinia)
const cityStore = useCityStore(pinia)
authStore.syncFromStorage()
if (authStore.isLoggedIn) {
  cityStore.syncFromStorage()
} else {
  cityStore.clearCities()
}

app.mount('#app');
