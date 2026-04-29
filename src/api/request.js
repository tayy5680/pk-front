import axios from 'axios'
import { useDefaultSetting } from '@/store/defaultSetting'
import { createPinia } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { i18n } from '@/i18n/locales'
const {
  global: { t },
} = i18n
let isAlertShown = false

export const instance = axios.create({
  baseURL: import.meta.env.VITE_API,
  timeout: 10000,
})

// GetToken
export const postGetToken = input => {
  const data = {
    x: input.x,
  }
  return instance.post('/Member/GetToken', data)
}
// 抖內
export const getDonateGameOptions = input => {
  const params = {
    GameId: input.gameId,
    Currency: input.currency,
    Lang: input.lang,
  }
  return instance.get('/Donate/GetGameOptions', { params })
}
// 抖內付款
export const postDonatePay = input => {
  const data = {
    optionId: input.optionId,
    currency: input.currency,
    amount: input.amount,
    doneeUserId: input.doneeUserId,
    streamChannelId: input.streamChannelId,
    locale: input.locale,
    message: input.message,
  }
  return instance.post('/Donate/Pay', data)
}

const showCountdownAlert = () => {
  ElMessageBox.alert(t(`您已用其他帳號登入，五秒後將重新整理`), t('通知'), {
    showClose: false,
    confirmButtonText: t('立即重新整理'),
    callback: () => {
      reLoad()
    },
  })
  // 五秒後更新
  setTimeout(() => reLoad(), 5000)
}

const reLoad = () => {
  isAlertShown = false
  // 清除網址參數
  const newUrl = window.location.origin + window.location.pathname
  window.history.pushState({}, '', newUrl)
  location.reload()
}

// axios資料處理
const actionRequest = instance => {
  instance.interceptors.request.use(config => {
    const store = useDefaultSetting()
    const token = localStorage.getItem('userToken') ?? ''

    if (!['/Member/GetToken'].includes(config?.url)) {
      if (store.token !== token && store.token) {
        // 您已用其他帳號登入
        if (!isAlertShown) {
          isAlertShown = true
          showCountdownAlert()
        }
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  })

  instance.interceptors.response.use(
    response => response.data,
    error => {
      if (['/Member/Info'].includes(error.config?.url)) {
        if (error.response && error.response.status === 401) {
          // Unauthorized (401): Token 可能已過期
          localStorage.removeItem('userToken')
          location.reload()
        }
      }
      return Promise.reject(error)
    },
  )
}
actionRequest(instance)
