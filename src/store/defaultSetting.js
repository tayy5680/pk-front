import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { dayjsLocales, i18n } from '../i18n/locales'
import { nextTick } from 'vue'
import { getMemberInfo } from '@/api/hall.js'
import { getSystemMainenance } from '@/api/site.js'
import { ElMessage } from 'element-plus'
const {
  global: { t },
} = i18n

export const useDefaultSetting = defineStore('defaultSetting', {
  state: () => ({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    memberInfo: {},
    gameList: [],
    language: '',
    refresh: true,
    isAppInitReady: false,
    isLeavePage: false,
    memberStatus: 0,
    registerVisible: {
      isVisible: false,
      isRegister: false,
      isBasicDataEmpty: false,
    },
    token: '',
    isMaintenance: null,
    maintenanceData: null,
  }),
  getters: {
    isMobile: state => state.screenWidth < state.screenHeight && state.screenWidth < 700,
  },
  actions: {
    setIsAppInitReady(bool) {
      this.isAppInitReady = bool
    },
    updateScreen() {
      this.screenWidth = window.innerWidth
      this.screenHeight = window.innerHeight
    },

    calculateCss(value, fluid = false) {
      // return (value / screenWidth.value) * 100
      if (fluid) return (value / this.screenWidth) * 100
      else if (this.screenWidth > 1280) {
        // Desktop
        return (value / 1920) * 100
      } else if (this.screenWidth > 750) {
        // pad
        return (value / 1280) * 100
      } else {
        // Mobile
        return (value / 750) * 100
      }
    },
    async reloadMemberInfo() {
      if (!localStorage.getItem('userToken')) return
      try {
        const memberInfo = await getMemberInfo().then(res => res.data)
        if (!memberInfo?.memberId) throw new Error(t('會員資料取得失敗，請重新整理畫面'))
        this.memberInfo = memberInfo
        this.memberStatus = memberInfo?.status ?? 0
      } catch (e) {
        ElMessage({
          showClose: true,
          message: e.message,
          type: 'error',
          duration: 0,
        })
      }
    },

    setGameList(data) {
      this.gameList = data
    },
    setLanguage(lang) {
      // 改變 dayjs 語系設定
      // 參考: https://gist.github.com/webjoyable/2a1503646b341bbf608cc5d33b228da2
      const setDayjsLocale = dayjsLocales[lang]
      setDayjsLocale().then(async () => {
        switch (lang) {
          case 'zh-TW':
            dayjs.locale('zh-tw')
            break
          case 'en-US':
            dayjs.locale('en')
            break
          // case 'zh-CN':
          //   dayjs.locale('zh-cn')
          //   break
          // case 'ja-JP':
          //   dayjs.locale('ja')
          //   break
          // case 'vi-VN':
          //   dayjs.locale('vi')
          //   break
        }

        // 強制重新渲染元件
        this.refresh = false
        await nextTick()
        this.refresh = true
      })

      this.language = lang
      localStorage.setItem('language', lang)
    },
    setIsLeavePage(bool) {
      this.isLeavePage = bool
    },
    setMemberStatus(int) {
      // 0啟用、1禁用
      this.memberStatus = int
    },
    setRegisterVisible(data) {
      this.registerVisible.isVisible = data.isVisible
      this.registerVisible.isRegister = data?.isRegister ?? false
      this.registerVisible.isBasicDataEmpty = data?.isBasicDataEmpty ?? false
    },
    setToken(data) {
      this.token = data
    },

    async fetchMaintenanceStatus() {
      try {
        const maintenance = await getSystemMainenance().then(res => res.data?.maintenances ?? [])
        // 預設狀態
        this.isMaintenance = false
        this.maintenanceData = null

        if (!maintenance.length) return

        const now = new Date()
        const currentMaintenance = maintenance.find(item => {
          const start = new Date(item.startDateTime)
          const end = new Date(item.endDateTime)
          return now >= start && now <= end
        })
        if (currentMaintenance) {
          this.isMaintenance = true
          this.maintenanceData = currentMaintenance
        }
      } catch (e) {
        this.isMaintenance = true
      }
    },
  },
})
