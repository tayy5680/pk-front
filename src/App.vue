<template>
  <div class="app" v-if="!isStandalone && memberStatus !== 1">
    <router-view></router-view>
    <ViewStreamerDialogPage />
    <ViewStreamerPicturePreview />
    <div class="version">{{ VERSION }}</div>
    <div class="loading-app" v-if="!isAppInitReady">
      <div class="spinner-border" role="status"></div>
    </div>
    <ViewFooter />
  </div>
  <div v-else class="app standalone">
    <!-- 獨立頁面的類型 -->
    <ViewErrorPage v-if="memberStatus === 1" />
    <router-view v-else></router-view>
  </div>
  <ViewRegister v-if="registerVisible.isVisible" />
</template>

<script setup>
  import ViewErrorPage from '@/components/Error/index.vue'
  import ViewStreamerPicturePreview from '@/components/StreamerPromotional/PicturePreview.vue'
  import ViewStreamerDialogPage from '@/components/StreamerPromotional/DialogPage.vue'
  import ViewRegister from '@/components/Register/index.vue'
  import ViewFooter from '@/components/Footer/index.vue'
  import { ref, watch, onMounted, onUnmounted, computed, provide } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useChat, useStream, useDonate } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { postGetToken } from '@/api/request.js'
  import { getGetStreamChannel } from '@/api/stream.js'
  import { postLocaleUpdate } from '@/api/member.js'
  import { ElMessage } from 'element-plus'
  import { useRouter, useRoute } from 'vue-router'
  import { getMemberInfo, getGameList } from '@/api/hall.js'
  import { postCheckLineLogin, postCheckAppleLogin } from '@/api/verification.js'
  import { useI18n } from 'vue-i18n'

  const { locale, t } = useI18n()

  const router = useRouter()
  const route = useRoute()
  const defaultSettingStore = useDefaultSetting()
  const chatStore = useChat()
  const streamStore = useStream()
  const donateStore = useDonate()
  const { initConnectWalletSignalR } = donateStore
  const { language, isAppInitReady, memberStatus, registerVisible, memberInfo, isMaintenance } = storeToRefs(defaultSettingStore)
  const VERSION = import.meta.env.VITE_VERSION
  const isStandalone = computed(() => route.meta?.standalone ?? false)
  const maintenanceInterval = ref(null)

  watch(language, async (newVal, oldVal) => {
    locale.value = newVal
    // 並非初次儲存時：出現切換成功提示訊息、重新取得遊戲列表
    if (oldVal) {
      ElMessage.success({ message: t('語系已切換成功'), showClose: true })
      storeGameList()
    }
    document.title = t('Cofun LIVE')
    if (newVal !== oldVal && localStorage.getItem('userToken')) await postLocaleUpdate({ locale: newVal }).catch(() => {})
  })

  const storeGameList = async () => {
    const gameList = await getGameList({ lang: language.value }).then(res => res.data)
    defaultSettingStore.setGameList(gameList)
  }
  const setGuestMode = () => {
    console.warn('TODO:訪客模式基礎設定')
    localStorage.removeItem('userToken')
  }

  const token = ref('')
  // 網址參數判斷角色身份＋取得token
  const getUserTokenFromUrl = async () => {
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    const gpgRequiredKeys = ['account', 'gameclienturl', 'gameid', 'gameserverurl', 'lang', 'returnurl', 'x', 'currency']
    const lineRequiredKeys = ['line_callback']
    const appleRequiredKeys = ['apple_callback']

    if (gpgRequiredKeys.every(param => window.location.href.includes(param))) {
      const paramX = decodeURIComponent(locationParamsObject?.x ?? '')
      const token = await postGetToken({ x: paramX }).then(res => res.data?.access_token ?? '')
      return token
    }

    if (lineRequiredKeys.every(param => window.location.href.includes(param))) {
      const lineLoginRes = await postCheckLineLogin({
        verifyCode: locationParamsObject.code,
        returnUrl: import.meta.env.VITE_LINE_REDIRECT_URI,
        referralCode: localStorage.getItem('referralCode') ?? null,
      }).then(res => res?.data)

      // 清除網址參數
      const newUrl = window.location.origin
      window.history.pushState({}, '', newUrl)
      localStorage.removeItem('referralCode')
      if (lineLoginRes.Status.Code.toString() !== '0') {
        ElMessage.error({ message: t('登入失敗，請稍後再試。'), duration: 3000 })
        return ''
      }
      const token = lineLoginRes?.data?.access_token ?? localStorage.getItem('userToken') ?? ''
      if (token) ElMessage.success({ message: t('登入成功！'), duration: 3000 })
      return token
    }
    if (appleRequiredKeys.every(param => window.location.href.includes(param))) {
      const appleLoginRes = await postCheckAppleLogin({
        verifyCode: locationParamsObject.code,
        returnUrl: import.meta.env.VITE_APPLE_REDIRECT_URI,
        referralCode: localStorage.getItem('referralCode') ?? null,
      }).then(res => res?.data)

      // 清除網址參數
      const newUrl = window.location.origin
      window.history.pushState({}, '', newUrl)
      localStorage.removeItem('referralCode')

      if (appleLoginRes.Status.Code.toString() !== '0') {
        ElMessage.error({ message: t('登入失敗，請稍後再試。'), duration: 3000 })
        return ''
      }
      const token = appleLoginRes?.data?.access_token ?? localStorage.getItem('userToken') ?? ''
      if (token) ElMessage.success({ message: t('登入成功！'), duration: 3000 })
      return token
    }
    return localStorage.getItem('userToken') ?? ''
  }

  const init = async (newToken = null) => {
    try {
      defaultSettingStore.setIsAppInitReady(false)

      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())
      // 1. 語系儲存
      if (localStorage.getItem('language') || locationParams.has('lang'))
        locale.value = localStorage.getItem('language') ?? locationParams.get('lang')
      defaultSettingStore.setLanguage(locale.value)

      //1.5 檢測網站是否維護中
      await defaultSettingStore.fetchMaintenanceStatus()
      if (defaultSettingStore.isMaintenance) return

      // 2. 取得 token
      token.value = newToken ?? (await getUserTokenFromUrl())

      // 如果有token就登入，無則判定為訪客
      if (token.value) {
        localStorage.setItem('userToken', token.value)
        defaultSettingStore.setToken(localStorage.getItem('userToken'))
        // 3. 取得MemberInfo()
        await defaultSettingStore.reloadMemberInfo()
        // 3.5 如果MemberInfo的isBasicDataEmpty為true則彈出填寫資料的畫面
        if (memberInfo.value?.isBasicDataEmpty)
          defaultSettingStore.setRegisterVisible({ isVisible: true, isRegister: false, isBasicDataEmpty: true })
        // 4. 取得錢包資料(currency, memberId)
        await initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
      } else setGuestMode()

      // 5. 取得直播列表
      const channelDataList = await getGetStreamChannel({
        GameId: locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID,
        Status: 1,
      }).then(res => res.data)
      streamStore.setChannelListData(channelDataList)
      // 5.5 取得即將上線的直播列表
      const channelCommingSoonList = await getGetStreamChannel({
        GameId: locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID,
        Status: 0,
      }).then(res => res.data)
      streamStore.setChannelCommingSoonData(channelCommingSoonList)

      // 6. 取得遊戲列表
      if (token.value) storeGameList()

      defaultSettingStore.setIsAppInitReady(true)
    } catch (e) {
      ElMessage({
        showClose: true,
        message: e.message,
        type: 'error',
        duration: 0,
      })
    }
  }
  provide('appInit', init)

  // 維護頁面跳轉
  watch(isMaintenance, val => {
    if (val) router.push('/Mainenance')
  })
  // 畫面直橫向監聽
  onMounted(() => {
    defaultSettingStore.setIsAppInitReady(true)
    window.addEventListener('resize', () => {
      defaultSettingStore.updateScreen()
    })
    defaultSettingStore.updateScreen()
    // 如果離開頁面再回來，直接重新整理
    document.addEventListener('visibilitychange', event => {
      if (route.name === 'Live') {
        if (event.target.visibilityState === 'visible' && !registerVisible.value.isVisible) {
          defaultSettingStore.setIsLeavePage(false)
        } else {
          // 離開頁面
          defaultSettingStore.setIsLeavePage(true)
        }
      }
    })

    init()

    // 每三分鐘檢測是否進入維護狀態
    maintenanceInterval.value = setInterval(
      async () => {
        await defaultSettingStore.fetchMaintenanceStatus()
      },
      3 * 60 * 1000,
    )
  })

  onUnmounted(() => {
    clearInterval(maintenanceInterval.value)
    window.removeEventListener('resize', () => {
      defaultSettingStore.updateScreen()
    })
  })
</script>

<style lang="scss" scoped>
  .version {
    color: gray;
    position: fixed;
    bottom: 0;
    right: 0;
  }

  .loading-app {
    background-color: #000000c7;
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    position: fixed;
    z-index: 99999999;
    inset: 0;

    .spinner-border {
      width: 30px;
      height: 30px;
      padding: 0;
    }
  }
</style>
