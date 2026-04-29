import { defineStore } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGetStreamChannel } from '@/api/stream.js'
import { i18n } from '@/i18n/locales.js'
import { useDefaultSetting } from './defaultSetting.js'

const {
  global: { t },
} = i18n

export const useChat = defineStore('chat', {
  state: () => ({
    receivedMsgData: {},
    donateMsgData: {},
    isDanmakuVisible: true,
    connectChat: null,
    chatSuccess: false,
    isConnecting: false,
    receiveLoveTime: 0,
    memberKickoutStatus: null, //使用者被踢出房間
    memberChatStatus: null, // 使用者禁言狀態
  }),
  actions: {
    setDanmaku(bool) {
      this.isDanmakuVisible = bool
    },
    async initConnectChatSignalR() {
      const defaultSettingStore = useDefaultSetting()
      if (!defaultSettingStore.memberInfo?.memberId) return
      if (this.isConnecting) return
      this.isConnecting = true
      console.log('聊天室連線中．．．')

      const streamStore = useStream()
      const channelData = streamStore.getChannelData
      let reconnect = false

      if (this.connectChat) {
        console.log('已有連線，先停止舊的連線...')
        this.stopConnectChat()
      }

      // 如果有記錄頻道ID
      if (sessionStorage.getItem('streamChannelId')) {
        const storedID = Number(sessionStorage.getItem('streamChannelId'))
        // 比對當前頻道ID與記錄的頻道ID
        if (streamStore.channelData.streamChannelId === storedID) reconnect = true
      }

      // 記錄頻道ID
      sessionStorage.setItem('streamChannelId', streamStore.channelData.streamChannelId)

      if (!channelData?.streamChannelId) {
        console.log('頻道資料取得失敗，請重新連線')
        // ElMessage({ showClose: true, message: t('頻道資料取得失敗，請重新連線'), type: 'error' })
        this.isConnecting = false
        return
      }

      var url = `${import.meta.env.VITE_CHAT_HOST}/chatHub?access_token=${localStorage.getItem('userToken')}&streamChannelId=${streamStore.channelData.streamChannelId}&isReconnect=${reconnect ? 1 : 0}`
      this.connectChat = await window.connectionSignalR
        .withUrl(url, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
          withCredentials: false,
        })
        .build()

      this.startConnectChat()
      // 監聽連線重試
      this.connectChat.onreconnecting(error => {
        console.log('聊天室重新連線中...', error)
      })
      // 設置斷線監聽
      this.connectChat.onclose(async () => {
        if (!this.chatSuccess) return
        console.log('SignalR 連線已斷開，嘗試重新連線...')
        // 攜帶 isReconnect 參數
        this.connectChat.connection.baseUrl = `${import.meta.env.VITE_CHAT_HOST}/chatHub?access_token=${localStorage.getItem('userToken')}&streamChannelId=${streamStore.channelData.streamChannelId}&isReconnect=1`
        await this.retryConnectChat()
      })

      this.connectChat.on(`ReceiveMessage-${streamStore.channelData.streamChannelId}`, msg => {
        this.receivedMsgData = JSON.parse(msg)
      })
      this.connectChat.on(`DonateMessage-${streamStore.channelData.streamChannelId}`, msg => {
        this.donateMsgData = JSON.parse(msg)
      })
      this.connectChat.on(`GetOnlineMember-${streamStore.channelData.streamChannelId}`, msg => {
        streamStore.setOnlineMembers(JSON.parse(msg))
      })
      this.connectChat.on(`ReceiveLove-${streamStore.channelData.streamChannelId}`, msg => {
        // 紀錄得到愛心的時間，在chat/index監聽receiveLove變化
        this.receiveLoveTime = new Date().getTime()
      })
      this.connectChat.on(`Status-${defaultSettingStore.memberInfo.memberId}`, number => {
        defaultSettingStore.setMemberStatus(parseInt(number))
      })

      // 結束直播事件
      this.connectChat.on(`FinishStream-${streamStore.channelData.streamChannelId}`, msg => {
        streamStore.setIsFinishStream(true)
      })
      // 不當直播內容審查
      this.connectChat.on(`Moderation-${streamStore.channelData.streamChannelId}`, number => {
        // number會給出1:不適當內容
        streamStore.setChannelData({
          ...streamStore.channelData,
          streamModerationNum: parseInt(number),
        })
      })

      // 玩家踢出偵測
      this.connectChat.on(`MemberKickedOut-${defaultSettingStore.memberInfo.memberId}`, obj => {
        this.memberKickoutStatus = JSON.parse(obj)
      })
      // 玩家禁言偵測
      this.connectChat.on(`MemberChatBanned-${defaultSettingStore.memberInfo.memberId}`, obj => {
        this.memberChatStatus = JSON.parse(obj)
      })
    },
    async startConnectChat() {
      await this.connectChat
        .start()
        .then(() => {
          console.log('聊天室 連線完成')
          this.isConnecting = false
          this.chatSuccess = true
          this.setDanmaku(true)
        })
        .catch(err => {
          console.log('聊天室連線錯誤: ' + err.toString())
          this.isConnecting = false
          this.setDanmaku(false)
          this.stopConnectChat()
          ElMessage({
            showClose: true,
            message: t('聊天室連線失敗，請重新進入直播間或聯繫客服人員'),
            type: 'error',
          })
        })
    },
    async retryConnectChat(maxRetries = 5, retryInterval = 3000) {
      let retries = 0

      while (retries < maxRetries) {
        try {
          console.log(`chat正在嘗試重新連線 (${retries + 1}/${maxRetries})...`)
          this.startConnectChat()
          console.log('chat重新連線成功')
          return // 成功後退出重連邏輯
        } catch (error) {
          console.log(`chat重連失敗: ${error.message}`)
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryInterval)) // 等待一段時間後重試
          }
        }
      }

      console.log('重連多次失敗，放棄重試')
    },

    stopConnectChat() {
      if (this.connectChat) {
        this.connectChat.stop().catch(error => {
          console.log('聊天室斷線失敗 ', error)
        })
        this.chatSuccess = false
        this.connectChat = null
        this.memberChatStatus = null
        this.memberKickoutStatus = null
      }
    },

    sendMessage(msg) {
      this.connectChat.invoke('SendMessage', msg).catch(err => {
        ElMessage({
          showClose: true,
          message: t('聊天室連線失敗，請重新加入或聯繫客服人員') + err.toString(),
          type: 'error',
        })
        this.stopConnectChat()
      })
    },
    sendLove() {
      this.connectChat.invoke('SendLove').catch(err => {
        console.warn('聊天室傳送SendLove失敗')
      })
    },
  },
})

export const useStream = defineStore('stream', {
  state: () => ({
    allChannelList: [],
    channelCommingSoonList: [],
    channelData: {},
    onlineMembers: [],
    isInitReady: false,
    gameIframeLink: '',
    donateOptionsList: [],

    isFinishStream: false,
    isGameEnd: false,
    isVideoMuted: true,
    isPreviewImgVisible: false,
    previewImgActiveIndex: 0,
    streamerPromotional: {},
    isStreamerPromotionalVisible: false,
  }),
  getters: {
    isFinishStreamAndGame: state => state.isGameEnd && state.isFinishStream,
    getChannelData: state => state.channelData,
  },
  actions: {
    setVideoMuted(bool) {
      this.isVideoMuted = bool
    },
    setChannelListData(data) {
      this.allChannelList = data
    },
    setChannelCommingSoonData(data) {
      this.channelCommingSoonList = data
    },
    setChannelData(data) {
      this.channelData = data
      // 如果streamOnly，當作遊戲已經結束
      this.setIsGameEnd(data.streamOnly)
    },
    setOnlineMembers(data) {
      this.onlineMembers = data
    },
    setInitReady(bool) {
      this.isInitReady = bool
    },
    setGameIframeLink(str) {
      this.gameIframeLink = str
    },
    setDonateOptionsList(data) {
      this.donateOptionsList = data
    },
    setIsFinishStream(bool) {
      this.isFinishStream = bool
    },
    setIsGameEnd(bool) {
      this.isGameEnd = bool
    },
    setStreamerPromotional(data) {
      this.streamerPromotional = data
    },

    setPreviewImgVisible(bool, index = 0) {
      this.isPreviewImgVisible = bool
      this.previewImgActiveIndex = index
    },
    setStreamerPromotionalVisible(bool) {
      this.isStreamerPromotionalVisible = bool
    },
    async checkIfStreamEnded(gameId, userId, channelId = -1) {
      const result = await getGetStreamChannel({ GameId: gameId, UserId: userId, Status: 1 })
      const resChannel = result?.Status?.Code === '0' && result.data?.find(el => el.streamChannelId === channelId)
      if (resChannel) {
        this.setChannelData(resChannel)
        return resChannel
      } else {
        // 畫面提示該直播已結束
        ElMessageBox.alert(t('主播已結束直播'), t('通知'), {
          confirmButtonText: t('確認'),
        })
        return null
      }
    },
  },
})

export const useDonate = defineStore('donate', {
  state: () => ({
    connectWallet: null,
    walletSuccess: false,
    walletPoint: 0,
    isConnecting: false,
  }),
  actions: {
    async initConnectWalletSignalR(currency, memberId) {
      if (!localStorage.getItem('userToken')) return
      const defaultSettingStore = useDefaultSetting()
      if (!defaultSettingStore.memberInfo?.memberId) return
      // 避免重複觸發連線行為
      if (this.isConnecting) return
      this.isConnecting = true

      const isFirstConnect = Boolean(!this.connectWallet)
      this.walletPoint = 0

      if (this.connectWallet) {
        await this.connectWallet.stop()
      } else {
        var url = `${import.meta.env.VITE_WALLET_HOST}/wallethub?access_token=${localStorage.getItem('userToken')}`
        this.connectWallet = await window.connectionSignalRWallet
          .withUrl(url, {
            skipNegotiation: true,
            withCredentials: false,
            transport: signalR.HttpTransportType.WebSockets,
          })
          .withAutomaticReconnect([0, 2, 5, 10])
          .build()
      }
      this.connectWallet
        .start()
        .then(() => {
          console.log('wallethub 連線完成')
          this.isConnecting = false
          this.walletSuccess = true
          this.updateWallet(currency, memberId)
        })
        .catch(err => {
          this.isConnecting = false
          console.log('wallethub連線錯誤: ' + err.toString())
          this.connectWallet = null
          this.walletSuccess = false
          ElMessage({
            showClose: true,
            message: t('wallet連線失敗，請重新加入或聯繫客服人員'),
            type: 'error',
          })
        })

      if (!isFirstConnect) return

      this.connectWallet.on(`WalletGet-${memberId}`, msg => {
        // 超過九億多就不顯示更多數字
        const point = parseInt(JSON.parse(msg).Point)
        this.walletPoint = point < 999999999 ? point.toLocaleString() : '999,999,999+'
      })
      // 監聽連線重試
      this.connectWallet.onreconnecting(error => {
        console.log('wallet重新連線中...', error)
        this.walletSuccess = false
      })
      this.connectWallet.onclose(async () => {
        if (!this.chatSuccess) return
        console.log('SignalR 連線已斷開，嘗試重新連線...')
        // 攜帶 isReconnect 參數
        this.connectWallet.connection.baseUrl = `${import.meta.env.VITE_WALLET_HOST}/wallethub?access_token=${localStorage.getItem('userToken')}`
        await this.retryConnectWallet()
      })
    },

    async retryConnectWallet(maxRetries = 5, retryInterval = 3000) {
      let retries = 0
      while (retries < maxRetries) {
        try {
          console.log(`wallet正在嘗試重新連線 (${retries + 1}/${maxRetries})...`)
          this.startConnectChat()
          console.log('wallet重新連線成功')
          return // 成功後退出重連邏輯
        } catch (error) {
          console.log(`wallet重連失敗: ${error.message}`)
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryInterval)) // 等待一段時間後重試
          }
        }
      }
      console.log('wallet重連多次失敗，放棄重試')
    },

    stopConnectWallet() {
      if (this.connectWallet) this.connectWallet.stop()
      this.connectWallet = null
      this.walletPoint = 0
    },

    updateWallet(currency, memberId) {
      const streamStore = useStream()
      this.connectWallet.invoke(`WalletGet`, currency).catch(err => {
        ElMessage({
          showClose: true,
          message: t('wallet傳送錯誤: ') + err.toString(),
          type: 'error',
        })
      })
    },
  },
})
