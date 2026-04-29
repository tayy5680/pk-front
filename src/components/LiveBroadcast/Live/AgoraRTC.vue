<template>
  <div class="live-webRTC">
    <div ref="remoteVideoRef" class="videoDivCss"></div>
    <div class="live-end" v-if="isFinishStream"></div>
    <div class="video-disconnect" v-if="agoraVideoMessage">
      <span>{{ $t(agoraVideoMessage) }}</span>
    </div>
  </div>
</template>
<script setup>
  import { ref, onMounted, onUnmounted, watch } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import AgoraRTC from 'agora-rtc-sdk-ng'
  const { t } = useI18n()
  const isVideoDisconnectMessage = ref(false)
  const streamStore = useStream()
  const { isInitReady, channelData, isFinishStream, isVideoMuted } = storeToRefs(streamStore)
  const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' })
  const localTracks = { audioTrack: null, videoTrack: null }
  const remoteVideoRef = ref(null)
  const agoraVideoMessage = ref('')
  const remoteAudioTrackRef = ref(null) // 存儲音軌

  const joinCallAudience = async () => {
    try {
      // todo 先確認 Token 是否有效，過期則更新
      // 先檢查是否已經在連線中或已連線
      if (client.connectionState === 'CONNECTING' || client.connectionState === 'CONNECTED') {
        console.warn('⚠️ 已經在直播中，無需重複加入')
        return
      }
      // 資料初始化
      agoraVideoMessage.value = ''
      remoteAudioTrackRef.value = null

      // 以觀眾身份連接
      await client.setClientRole('audience', { level: 1 })
      await client.join(channelData.value.appId, channelData.value.channelName, channelData.value.token, null)
      agoraVideoMessage.value = '直播尚未開始'

      // 訂閱並播放主播的直播流
      client.on('user-published', async (user, mediaType) => {
        console.log('> 直播主開始直播：', mediaType)
        await client.subscribe(user, mediaType)
        console.log('✅ 成功訂閱主播流')
        agoraVideoMessage.value = ''

        if (mediaType === 'video') {
          const remoteTrack = user.videoTrack
          remoteTrack.play(remoteVideoRef.value)
        }
        if (mediaType === 'audio') {
          remoteAudioTrackRef.value = user.audioTrack // 存儲音軌
          if (isVideoMuted.value) {
            remoteAudioTrackRef.value.stop()
            remoteAudioTrackRef.value.setVolume(0)
          } else {
            remoteAudioTrackRef.value.play()
            remoteAudioTrackRef.value.setVolume(50)
          }
        }
      })
    } catch (e) {
      console.error('觀看直播失敗:', e)
      agoraVideoMessage.value = '直播出現異常'
      // 判斷是否為 Token 過期或無效
      if (e.message.includes('CAN_NOT_GET_GATEWAY_SERVER') || e.message.includes('dynamic key or token timeout')) {
        console.log('Token 過期，重新取得 Token 並重新初始化')
        agoraVideoMessage.value = '直播參數已過期'
      }
    }
  }

  const leaveCallAudience = async () => {
    try {
      // 離開頻道
      client.off('user-published')
      await client.leave()
      console.log('👋 已成功離開直播頻道')
      remoteAudioTrackRef.value = null
    } catch (e) {
      console.error('❌ 離開直播失敗:', e)
    }
  }

  // 切換靜音
  watch(isVideoMuted, val => {
    if (remoteAudioTrackRef.value) {
      if (val) {
        remoteAudioTrackRef.value.stop()
        remoteAudioTrackRef.value.setVolume(0)
      } else {
        remoteAudioTrackRef.value.play()
        remoteAudioTrackRef.value.setVolume(100)
      }
    }
  })

  // =====OLD=======
  const isFollowed = ref(false)
  const player = ref(null)

  watch(isFinishStream, val => {
    if (val) {
      ElMessageBox.alert(t('主播已結束直播'), t('通知'), {
        confirmButtonText: t('確認'),
        showClose: false,
      })
    }
  })

  onMounted(() => {
    joinCallAudience()
  })

  onUnmounted(() => {
    leaveCallAudience()
    streamStore.setIsFinishStream(false)
  })
</script>

<style lang="scss" scoped>
  .live-webRTC {
    position: relative;
    width: 100%;
    height: 100%;

    .video-disconnect {
      pointer-events: none;
      color: white;
      position: absolute;
      z-index: 99;
      top: 100px;
      margin: 0 auto;
      width: 100%;
      text-align: center;
      animation: blink 2s infinite;
      span {
        background-color: var(--main-red);
        border-radius: 30px;
        padding: 5px 20px;
      }
    }
    @keyframes blink {
      0%,
      100% {
        opacity: 1; /* 完全可見 */
      }
      50% {
        opacity: 0; /* 完全隱藏 */
      }
    }

    .videoDivCss {
      height: 100%;
      width: 100%;
      border-radius: 15px;
      background: black;

      #player-container-id {
        height: 100%;
        width: 100%;
        border-radius: 15px;

        video {
          object-fit: cover; /* 让视频内容覆盖整个容器 */
          width: 100%;
          height: 100%;
        }
      }
    }

    :deep(.vjs-errors-dialog) {
      top: auto;
      height: calc(100svh - 100px);
    }
    :deep(.vjs-error-display) {
      // TODO 暫時解決錯誤訊息的問題
      display: none;
    }

    .live-end {
      background-color: black;
      position: fixed;
      display: flex;
      flex-direction: column;
      inset: 0;
      overflow: hidden;
      align-items: center;
      justify-content: center;
    }
  }
</style>
