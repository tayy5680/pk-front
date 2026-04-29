<template>
  <div class="web-live px-md-4">
    <div class="d-flex row">
      <div v-if="!isMobile" class="left col-4">
        <ViewStreamerPromotional :userId="streamerInfo?.userId" :openStreamerChannel="openStreamerChannel" />
      </div>
      <div class="middle col-lg-4 col-md-6 col-12">
        <ViewLiveBroadcast :class="{ blur: isFinishStreamAndGame }" v-if="!isStreamSuspended" />
        <div v-if="isFinishStreamAndGame" class="finish-stream-and-game">
          <div class="fw-bold py-3 fs-5">{{ $t('直播已結束') }}</div>
          <el-avatar class="mb-2" :size="100" :src="streamerInfo?.photoPath" fit="cover">
            <img :src="userPhoto" />
          </el-avatar>
          <div class="fw-bold">{{ streamerInfo?.memberName ?? '-' }}</div>
          <div><i class="bi bi-eye pe-1"></i>{{ onlineMembers?.length ?? 0 }}</div>
          <el-button round class="opacity-red-btn m-0 mt-2" @click="actionBack">
            {{ $t('返回大廳') }}
          </el-button>
        </div>
        <div class="stream-block-message" v-if="isStreamSuspended">
          <div class="fw-bold py-3 fs-5">{{ $t('直播已暫停') }}</div>
          <div class="fw-bold">{{ $t('為維護平台內容品質，此直播因不符合規範已被暫停播放。') }}</div>
          <el-button round class="opacity-red-btn m-0 mt-4" @click="actionBack">
            {{ $t('返回大廳') }}
          </el-button>
        </div>
      </div>
      <div v-if="!isMobile" class="right col-lg-4 col-6">
        <ViewDonateList />
      </div>
    </div>
  </div>
</template>
<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import 'vue3-carousel/dist/carousel.css'
  import { ref, watch, onMounted, computed, onUnmounted, provide } from 'vue'
  import ViewLiveBroadcast from './LiveBroadcast.vue'
  import ViewDonateList from './DonateList.vue'
  import ViewStreamerPromotional from '@/components/StreamerPromotional/index.vue'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { getDonateGameOptions } from '@/api/request.js'
  import { getGetStreamChannel, getGameLink, getGuestGameLink, getStreamerInfo } from '@/api/stream.js'
  import { useStream, useChat, useDonate } from '@/store/live.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
  import { Carousel, Pagination, Slide, Navigation } from 'vue3-carousel'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const streamStore = useStream()
  const chatStore = useChat()
  const donateStore = useDonate()
  const defaultSettingStore = useDefaultSetting()
  const { channelData, onlineMembers, isFinishStreamAndGame, streamerPromotional } = storeToRefs(streamStore)
  const { isMobile, isAppInitReady, language, memberInfo, isLeavePage } = storeToRefs(defaultSettingStore)

  // 直播因偵測到不適當內容而暫停
  const streamModerationNum = computed(() => channelData.value?.streamModerationNum === 1)
  const isStreamSuspended = ref(streamModerationNum.value === 1)
  watch(streamModerationNum, val => {
    if (val === 1) isStreamSuspended.value = true
  })

  const router = useRouter()
  const getDonateOptionList = async () => {
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    const gameid = locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID
    const dInput = {
      gameId: channelData.value.gameId,
      currency: memberInfo.value?.currency ?? 'TWD',
      lang: language.value,
    }
    await getDonateGameOptions(dInput)
      .then(res => {
        const options = res.data.sort((a, b) => a.optionCategoryId - b.optionCategoryId || a.price - b.price)
        streamStore.setDonateOptionsList(options)
      })
      .catch(e => {
        streamStore.setDonateOptionsList([])
      })
  }

  const actionBack = () => {
    router.push('/')
  }

  // 未登入（訪客模式）時公用參數 =====
  const handleLoginRedirect = async () => {
    try {
      await ElMessageBox.confirm(t('登入後即可參與直播互動'), t('通知'), {
        confirmButtonText: t('前往登入'),
        cancelButtonText: t('取消'),
        cancelButtonClass: 'cancel-btn',
        showClose: false,
      })
    } catch {
      return
    }
    const loginUrl = `${import.meta.env.VITE_LOGIN_REDIRECT_URL}?actionPlay=true&returnUrl=${encodeURIComponent(location.href)}&CofunLiveCode=${channelData.value.referralCode}`

    window.open(loginUrl, '_blank')
  }
  provide('handleLoginRedirect', handleLoginRedirect)

  // Drawer控制區
  const drawerList = ref({
    donate: false, // 抖內列表
    mainList: false, // 主選單
    onlineMembersList: false, // 直播的觀看者列表
    share: false, // 分享連結
    streamerChannel: false, // 直播主預定行程列表
    streamerPromotional: false, // 直播主介面
    streamerPromotionalMenu: false, // 直播者介面-右上menu
    reportStreamer: false, // 檢舉
  })
  const setDrawer = (itemName, bool) => {
    if (itemName === 'all') {
      Object.keys(drawerList.value).forEach(key => {
        drawerList.value[key] = bool
      })
    }
    if ((!itemName) in drawerList.value) return
    drawerList.value[itemName] = bool
  }
  provide('drawerList', drawerList)
  provide('setDrawer', setDrawer)

  // 檢查直播頻道是否連線中
  const checkStreamChannel = async () => {
    if (isFinishStreamAndGame.value) return false
    const { search } = window.location
    const params = new URLSearchParams(search)

    try {
      const input = {
        GameId: params.get('gameid') ?? import.meta.env.VITE_GAME_ID,
        UserId: params.get('streamerid'),
        Status: 1,
      }
      const result = await getGetStreamChannel(input).then(res => res)
      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())
      const resChannel =
        result?.Status?.Code === '0' &&
        result?.data?.find(el => el.streamChannelId === parseInt(locationParamsObject.streamchannelid))

      if (!resChannel) throw new Error()
      streamStore.setChannelData(resChannel)
    } catch {
      // 直接結束頻道直播，使isFinishStreamAndGame為true
      streamStore.setIsFinishStream(true)
      streamStore.setIsGameEnd(true)
    }
  }
  // window.addEventListener 重新連線偵測
  const connCheckCounter = ref(0)
  const isReconnectCheckActive = ref(true)
  const connInterval = ref(null)
  const keepConnected = () => {
    //  10秒偵測一次就好
    connInterval.value = setInterval(() => {
      if (connCheckCounter.value >= 10) {
        isReconnectCheckActive.value = true
        connCheckCounter.value = 0
      }
      connCheckCounter.value++
    }, 1000)

    const userActivityEvents = ['mousemove', 'keydown', 'touchstart']
    userActivityEvents.forEach(event => {
      window.addEventListener(event, () => {
        if (isReconnectCheckActive.value) {
          isReconnectCheckActive.value = false
          if (!donateStore.walletSuccess || !chatStore.chatSuccess) checkStreamChannel()
          if (!donateStore.walletSuccess)
            donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
          if (!chatStore.chatSuccess) chatStore.initConnectChatSignalR()
        }
      })
    })
  }
  const streamerInfo = ref({})
  provide('streamerInfo', streamerInfo)
  const init = async () => {
    streamStore.setInitReady(false)
    if (!isAppInitReady.value) return

    try {
      // 玩家狀態：有登入-功能開放，未登入（訪客模式）：所有按鈕都連接到登入
      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())

      // 1. 網址沒有streamChannelId和streamerId跳回首頁
      if (!locationParamsObject?.streamerid || !locationParamsObject?.streamchannelid) {
        throw new Error(t('目前沒有直播'))
      }
      // 2. 直播主資料
      streamerInfo.value = await getStreamerInfo({
        UserId: locationParamsObject.streamerid,
      }).then(res => res.data)
      if (!streamerInfo.value) throw new Error(t('目前直播的遊戲網址失效，請稍後再試或聯繫客服。'))

      // 3. 判斷channelData是否存在 或 用網址參數取得
      if (!Object.keys(channelData.value).length) {
        const result = await getGetStreamChannel({
          GameId: locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID,
          UserId: locationParamsObject.streamerid,
          Status: 1,
        })

        if (result?.Status?.Code === '0' && result.data?.length) {
          const resChannel = result.data.find(el => el.streamChannelId === parseInt(locationParamsObject.streamchannelid))
          if (resChannel) streamStore.setChannelData(resChannel)
          else throw new Error(t('目前沒有直播'))
        } else {
          throw new Error(t('目前沒有直播'))
        }
      }

      // 4.取得遊戲網址
      if (!channelData.value.streamOnly) {
        let getLinkFn = memberInfo.value?.memberId ? getGameLink : getGuestGameLink
        const gameLink = await getLinkFn({
          GameId: locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID,
          Currency: memberInfo.value?.currency ?? channelData.value.currency,
          Lang: locationParamsObject?.lang ?? localStorage.getItem('language'),
        })
          .then(res => res.data)
          .catch(() => {
            throw new Error(t('目前直播的遊戲網址失效，請稍後再試或聯繫客服。'))
          })

        if (gameLink?.url) {
          const gameLinkLocationParams = new URLSearchParams(gameLink.url)
          const gameLinkLocationParamsObject = Object.fromEntries(gameLinkLocationParams.entries())
          const gameLinkQueryString = new URL(gameLink.url).search
          const gameUrl = decodeURIComponent(
            `${gameLinkLocationParamsObject.gameclienturl}${gameLinkQueryString}&streamchannelid=${locationParamsObject.streamchannelid}&streamerid=${locationParamsObject.streamerid}&roomId=${channelData.value.roomId}&gameserverurl=${channelData.value.gameServerUrl}`,
          )
          streamStore.setGameIframeLink(gameUrl)
        } else throw new Error(t('目前直播的遊戲網址失效，請稍後再試或聯繫客服。'))
      } else streamStore.setGameIframeLink('')

      //6. 取得抖內禮物列表
      getDonateOptionList()

      //  ＝＝＝必要api跑完的判定＝＝＝
      streamStore.setInitReady(true)

      // 8. 如果沒有連線聊天室，就再次連線
      if (!chatStore.chatSuccess) chatStore.initConnectChatSignalR()

      // 9. 錢包連線(currency, memberId)
      if (!donateStore.connectWallet && memberInfo.value.memberId)
        donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)

      // 10.持續的連線偵測
      keepConnected()
    } catch (e) {
      streamStore.setInitReady(false)
      console.error(e.message)
      ElMessageBox.alert(e.message, t('通知'), {
        autofocus: false,
        showClose: false,
        confirmButtonText: t('返回大廳'),
        callback: action => {
          // 移除紀錄的頻道ID
          sessionStorage.removeItem('streamChannelId')
          const params = new URLSearchParams(window.location.search)
          params.delete('streamchannelid')
          params.delete('streamerid')
          router.push({ path: '/', query: Object.fromEntries(params.entries()) })
        },
      })
    }
  }

  const openStreamerChannel = () => {
    setDrawer('streamerChannel', true)
  }
  provide('refreshInit', init)

  watch(isAppInitReady, val => {
    if (val) init()
  })
  watch(isLeavePage, val => {
    if (!val) init()
  })
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    streamStore.setChannelData({})
    setDrawer('all', false)
    clearInterval(connInterval.value)
    // 頁面切換時關閉錯誤訊息
    ElMessage.closeAll()
  })

  // 語系變更時重新取得api
  watch(language, () => {
    getDonateOptionList()
  })
</script>
<style lang="scss" scoped>
  .web-live {
    background-color: #1f2530;
    > .row {
      height: 100svh;
      justify-content: center;
      align-content: center;
      flex-direction: column;

      > div {
        height: 100%;
        border-radius: 15px;
        padding: 0;
        overflow: hidden;
        scale: 0.96;
        flex-grow: 1;
        flex-shrink: 1;
      }
      @media screen and (max-width: 576px) {
        > div {
          border-radius: 0;
          scale: 1;
        }
      }
      .left {
        max-width: 50svh;
        display: flex;
        flex-direction: column;
      }
      .middle {
        width: var(--game-width);
        flex-grow: 0;
        flex-shrink: 0;

        > .blur {
          filter: blur(3px);
        }

        .finish-stream-and-game {
          width: 100%;
          height: 100%;
          color: white;
          background-color: #00000065;
          position: absolute;
          z-index: 99;
          top: 0;
          display: flex;
          flex-direction: column;
          inset: 0;
          overflow: hidden;
          align-items: center;
          justify-content: center;

          button {
            &.hover {
              background-color: var(--main-red);
              color: white;
              border-color: var(--main-red);
            }
          }
        }
        .stream-block-message {
          width: 100%;
          height: 100%;
          color: white;
          background-color: black;
          position: absolute;
          z-index: 99;
          top: 0;
          display: flex;
          flex-direction: column;
          inset: 0;
          overflow: hidden;
          align-items: center;
          justify-content: center;
          padding: 0 15%;

          button {
            &.hover {
              background-color: var(--main-red);
              color: white;
              border-color: var(--main-red);
            }
          }
        }
      }
      .right {
        background-color: #263045;
        max-width: 50svh;
        border: 1px solid #3a4b70;
        border-radius: 15px;
      }

      @media screen and (max-width: 992px) {
        .left {
          display: none;
        }
      }

      @media screen and (max-width: 576px) {
        .right {
          display: none;
        }
      }
    }

    @media screen and (max-width: 576px) {
      > .d-flex {
        padding: 0;
      }
    }
  }
</style>
