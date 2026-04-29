import { createApp, h } from 'vue'

import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { i18n } from '@/i18n/locales.js'
import { useI18n } from 'vue-i18n'
import './assets/css/variables.scss'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'element-plus/dist/index.css'
import VueTelInput from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'

const app = createApp({
  render: () => h(App),
  setup() {
    const { locale } = useI18n()
    const savedLanguage = localStorage.getItem('language')
    const params = new URLSearchParams(window.location.search)
    const paramsLang = params.get('lang')
    // 語系順序 localStorage > 網址參數 > env
    locale.value =
      savedLanguage && savedLanguage !== 'undefined'
        ? savedLanguage
        : paramsLang
          ? paramsLang
          : import.meta.env.VITE_LANGUAGE ?? 'zh-TW'
    localStorage.setItem('language', locale.value)

    const script = document.createElement('script')
    script.src = `${import.meta.env.VITE_CHAT_HOST}/js/signalr/dist/browser/signalr.js`
    script.async = true

    script.onload = () => {
      window.connectionSignalR = new signalR.HubConnectionBuilder()
      window.connectionSignalRWallet = new signalR.HubConnectionBuilder()
    }

    document.head.appendChild(script)
  },
})
app.use(i18n)
app.use(router)
app.use(ElementPlus)
app.use(createPinia())
app.use(VueTelInput)
app.mount('#app')
