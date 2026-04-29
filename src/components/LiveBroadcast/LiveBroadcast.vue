<template>
  <div class="live-broadcast">
    <div class="d-flex">
      <div class="live-header-ui">
        <!-- 頭像、名字 -->
        <div class="avatar-name">
          <div class="avatar" @click="setStreamerPromotionalDrawerVisible">
            <el-avatar class="me-3" :size="50" :src="streamerInfo?.photoPath">
              <img :src="userPhoto" />
            </el-avatar>
          </div>
          <div class="live-icon" v-if="!isFinishStream && channelData?.userId"><i class="bi bi-camera-video-fill"></i> LIVE</div>
          <div class="name">
            <div>{{ channelData?.roomName ?? '-' }}</div>
            <div class="d-flex view">
              <div @click="setDrawer('onlineMembersList', true)" class="d-flex align-items-center">
                <el-icon><View /></el-icon>
                <div>{{ onlineMembers?.length ?? 0 }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ui-btn d-flex">
          <div @click="setVideoMuted">
            <i :class="`bi ${isVideoMuted ? 'bi-volume-mute-fill' : 'bi-volume-down-fill'} pe-1`"></i>
          </div>
          <div class="music_tip" v-if="isMusicTip">
            {{ $t('請開啟直播聲音') }}<button @click="closeMusicTip">{{ $t('確認') }}</button>
          </div>
          <div @click="setDrawer('mainList', true)"><i class="bi bi-three-dots"></i></div>
        </div>
        <div class="wallet-point" v-if="connectWallet"><el-image :src="goldImg" /> {{ walletPoint }}</div>
      </div>

      <div v-if="!isInitReady" class="spin-loading">
        <div class="icon pb-3">
          <i class="bi bi-arrow-clockwise"></i>
          <span class="ps-2">Loading ...</span>
        </div>
        <el-button class="opacity-red-btn ms-2 mt-2" round @click="refreshInit">{{ $t('重新整理') }}</el-button>
      </div>
      <div class="bg-live" v-else>
        <div class="live-live2">
          <ViewWebRTC v-if="!isLeavePage" :webrtcUrl="channelData.pullStreamUrl" />
        </div>
        <div class="live-game">
          <iframe
            ref="liveGameIframe"
            v-if="gameIframeLink && !isLeavePage && !channelData.streamOnly"
            scrolling="no"
            ftameborder="0"
            style="background-color: transparent"
            allowtransparency="true"
            :src="gameIframeLink"
          ></iframe>
        </div>
      </div>
      <ViewLiveChat />
    </div>

    <!-- 抽屜們 -->
    <ViewMainList />
    <ViewOnlineMembersList />
    <ViewDonateList />
    <ViewStreamerChannel />
    <ViewShareList />
    <ViewStreamerPromotional />
    <ViewStreamerPromotionalMenu />
    <ViewReportStreamer />
  </div>
</template>
<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, watch, onMounted, nextTick, onUnmounted, inject } from 'vue'
  import { MoreFilled, View } from '@element-plus/icons-vue'
  import { useChat, useStream, useDonate } from '@/store/live.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
  import ViewLiveChat from './Chat/index.vue'
  import ViewMainList from './Drawer/MainList.vue'
  import ViewShareList from './Drawer/ShareList.vue'
  import ViewOnlineMembersList from './Drawer/OnlineMembersList.vue'
  import ViewDonateList from './Drawer/DonateList.vue'
  import ViewStreamerPromotional from './Drawer/StreamerPromotional.vue'
  import ViewStreamerPromotionalMenu from './Drawer/StreamerPromotionalMenu.vue'
  import ViewReportStreamer from './Drawer/ReportStreamer.vue'
  import ViewStreamerChannel from './Drawer/StreamerChannel.vue'
  import ViewWebRTC from './Live/AgoraRTC.vue'
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const router = useRouter()
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')
  const streamerInfo = inject('streamerInfo')
  const defaultSetting = useDefaultSetting()
  const chatStore = useChat()
  const streamStore = useStream()
  const donateStore = useDonate()
  const { isMobile, screenWidth, language, isLeavePage } = storeToRefs(defaultSetting)
  const { channelData, onlineMembers, isInitReady, gameIframeLink, isFinishStream, isVideoMuted } = storeToRefs(streamStore)
  const { connectWallet, walletPoint } = storeToRefs(donateStore)

  const setVideoMuted = () => {
    if (isMusicTip.value) closeMusicTip()
    streamStore.setVideoMuted(!isVideoMuted.value)
  }
  onUnmounted(() => {
    window.removeEventListener('message', handleMessageFromIframe)
    window.removeEventListener('EndGame', handleMessageFromIframe)
  })

  // 接收來自遊戲 iframe 的訊息
  const handleMessageFromIframe = event => {
    if (gameIframeLink.value.indexOf(event.origin) < 0) return

    const data = event.data
    if (!data) return console.warn('未收到iframe內容')
    switch (data.cmd) {
      case 'EndGame':
        streamStore.setIsGameEnd(true)
        break
      case 'GameDisconnect':
        streamStore.setInitReady(false)
        break
      case 'GameError':
        ElMessageBox.alert(data.data.message, t('通知'), {
          confirmButtonText: t('確認'),
          showClose: false,
        })
        break
      case 'GetInit':
        postLanguage(language.value)
        postMuted()
        break
    }
  }

  const setStreamerPromotionalDrawerVisible = () => {
    setDrawer('streamerPromotional', true)
  }

  // Postmessage 將語系傳送給 cocos 遊戲
  const liveGameIframe = ref(null)
  const postLanguage = lang => {
    nextTick(() => {
      if (!liveGameIframe.value) return
      liveGameIframe.value.contentWindow.postMessage(
        {
          cmd: 'SetLanguage',
          data: {
            lang: lang,
          },
        },
        '*',
      )
    })
  }
  // Postmessage 將傳送給 cocos 遊戲
  const postMuted = () => {
    nextTick(() => {
      if (!liveGameIframe.value) return
      liveGameIframe.value.contentWindow.postMessage(
        {
          cmd: 'SetMuted',
          data: {
            isMuted: isVideoMuted.value,
          },
        },
        '*',
      )
    })
  }
  watch(language, val => {
    if (!val) return
    postLanguage(val)
  })
  watch(isVideoMuted, () => {
    postMuted()
  })
  onMounted(() => {
    // 監聽 postMessage 事件
    window.addEventListener('message', handleMessageFromIframe)
    isMusicTip.value = Boolean(localStorage.getItem('musicTip') !== 'close')
  })
  const refreshInit = inject('refreshInit')

  // 音樂開啟提示
  const isMusicTip = ref(false)
  const closeMusicTip = () => {
    isMusicTip.value = false
    localStorage.setItem('musicTip', 'close')
  }
</script>

<style lang="scss" scoped>
  .live-broadcast {
    width: 100%;
    height: 100%;
    color: white;
    background-color: black;

    .music_tip {
      background-color: var(--main-red);
      position: absolute;
      margin-top: 40px;
      padding: 10px;
      border-radius: 10px;
      width: 150px;
      right: 10px;
      z-index: 9999;
      text-align: center;

      &::before {
        content: '';
        position: absolute;
        top: -18px;
        left: 68%;
        transform: translateX(-50%);
        border-width: 10px;
        border-style: solid;
        border-color: transparent transparent var(--main-red) transparent;
      }

      button {
        padding: 0 5px;
        margin-top: 5px;
        border-radius: 10px;
        margin-left: auto;
      }
    }

    > .d-flex {
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      .live-header-ui {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
        z-index: 10;
        width: 100%;
        padding: 0 15px;
        height: 10svh;
        min-height: 70px;

        .avatar-name {
          display: flex;
          flex-grow: 1;

          .avatar {
            cursor: pointer;
          }

          .view {
            cursor: pointer;
            font-size: 14px;
            line-height: 14px;
            padding-top: 3px;

            i {
              margin-right: 5px;
              margin-bottom: -1px;
            }
          }

          .live-icon {
            position: absolute;
            top: 50%;
            margin-top: 8px;
            font-size: 11px;
            border-radius: 10px;
            width: 50px;
            text-align: center;
            padding: 3px 4px;
            background: #f78361;
            background: -webkit-linear-gradient(to right, #f54b64, #f78361);
            background: linear-gradient(to right, #f54b64, #f78361);
            letter-spacing: -0.8px;
            line-height: 12px;

            i {
              padding-right: 2px;
            }
          }

          .name {
            white-space: nowrap;
            width: 10px;
            flex-grow: 1;

            > div {
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }

        .ui-btn {
          cursor: pointer;

          i {
            font-size: 26px;
            text-shadow: 0px 0px 4px #000000;
          }
        }

        .wallet-point {
          background-color: #8084bb4d;
          position: fixed;
          top: 10svh;
          right: 2svh;
          display: flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 30px;
          font-size: 13px;

          :deep(img) {
            width: 13px;
            height: 13px;
            display: block;
            margin-right: 8px;
          }
        }
      }

      .bg-live {
        height: 100%;
        width: 100%;
        position: absolute;

        .live-live2 {
          height: 100%;
          width: var(--game-width);
          position: absolute;

          iframe {
            width: 100%;
            height: 100%;
            object-fit: cover; /* 其他選項有 contain, fill */
            border: none;
          }
        }

        .live-game {
          height: 100%;
          width: 100%;
          overflow: hidden;
          position: relative;
          z-index: 1;

          iframe {
            height: 100%;
            width: 100%;
            max-width: 50svh;
            background-color: transparent;

            body {
              background-color: #00000000;
            }
          }
        }
      }
    }
  }
</style>
