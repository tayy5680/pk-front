<template>
  <el-drawer
    class="darkDrawer streamer-promotional"
    v-model="drawerList.streamerPromotional"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    size="auto"
  >
    <div class="main-menu">
      <el-image class="main-photos" :src="streamerPromotional?.photos?.[0].photoPath">
        <template #error>
          <img :src="defaultPhoto2" />
        </template>
      </el-image>
      <button class="streamer-menu-btn" @click="openStreamerMenu">
        <i class="bi bi-three-dots"></i>
      </button>
      <div class="main-container">
        <div class="info">
          <el-avatar class="avatar" :src="channelData?.photoPath" :fit="'cover'">
            <img :src="userPhoto" />
          </el-avatar>
          <div class="streamer-title">
            <div class="streamer-name">{{ channelData?.name ?? '-' }}</div>
            <div class="streamer-info">
              <span class="fans">{{ formatter.format(streamerInfo?.fansCount ?? 0) }} {{ $t('粉絲') }}</span>
              <el-divider direction="vertical" />
              <span>@{{ streamerInfo?.account }}</span>
              <button @click="copyAccount(streamerInfo?.account)"><i class="bi bi-copy"></i></button>
            </div>
          </div>
        </div>
        <div class="info-room-name">
          {{ channelData?.roomName ?? '-' }}
        </div>
        <div>
          <i class="bi bi-camera-video-fill icon-live"></i>
          <span class="icon-live">LIVE</span>
          {{ liveTime }}
        </div>
        <div class="online-members" @click="opanOnlineMembersList">
          <i class="bi bi-eye icon-live"></i>{{ onlineMembers?.length ?? 0 }}
        </div>
      </div>
      <button
        class="follow-btn"
        :class="{ following: streamerPromotional.isFollowed }"
        :disabled="isLoading"
        @click="actionFollow(!streamerPromotional.isFollowed)"
      >
        <i :class="`bi ${streamerPromotional.isFollowed ? 'bi-check2-circle' : 'bi-plus-circle'} pe-2`"></i>
        {{ streamerPromotional.isFollowed ? $t('追蹤中') : $t('追蹤') }}
      </button>
    </div>
  </el-drawer>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import defaultPhoto2 from '@/assets/image/hall/default_photo_2.svg'
  import { inject, ref, watch, onMounted, onUnmounted } from 'vue'
  import { postFollowStreamer, getStreamerInfo } from '@/api/stream.js'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import dayjs from 'dayjs'
  import duration from 'dayjs/plugin/duration'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import ViewStreamerPromotional from '@/components/StreamerPromotional/index.vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const streamStore = useStream()
  const { channelData, streamerPromotional, onlineMembers } = storeToRefs(streamStore)
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')
  const streamerInfo = inject('streamerInfo')
  const isLoading = ref(false)

  dayjs.extend(duration)

  const closeDrawer = () => {
    setDrawer('streamerPromotional', false)
  }
  const openStreamerMenu = () => {
    setDrawer('streamerPromotionalMenu', true)
    setDrawer('streamerPromotional', false)
  }
  const opanOnlineMembersList = () => {
    setDrawer('onlineMembersList', true)
    setDrawer('streamerPromotional', false)
  }

  const formatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    compactDisplay: 'short',
  })

  const secondInterval = ref(null)
  const liveTime = ref('...')
  const timeFormatter = startTime => {
    liveTime.value = '...'
    if (!startTime) return
    secondInterval.value = setInterval(() => {
      const diff = dayjs().diff(dayjs(startTime))
      const d = dayjs.duration(diff)

      const hours = String(Math.floor(d.asHours())).padStart(2, '0')
      const minutes = String(d.minutes()).padStart(2, '0')
      const seconds = String(d.seconds()).padStart(2, '0')

      liveTime.value = `${hours}:${minutes}:${seconds}`
    }, 1000)
  }
  watch(
    () => drawerList.value.streamerPromotional,
    val => {
      if (val) timeFormatter(channelData.value?.startTime)
      else {
        clearInterval(secondInterval.value)
        secondInterval.value = null
      }
    },
  )

  const actionFollow = async bool => {
    console.log('actionFollow')
    if (isLoading.value) return
    if (!bool) {
      try {
        await ElMessageBox.confirm(t('要取消追蹤{name}嗎？', { name: ` ${channelData.value.name} ` }), t('通知'), {
          confirmButtonText: t('是'),
          cancelButtonText: t('否'),
          cancelButtonClass: 'cancel-btn',
          showClose: false,
        })
      } catch (e) {
        console.log(e)
        return
      }
    }
    isLoading.value = true

    try {
      const input = {
        userId: parseInt(channelData.value.userId),
        isFollow: bool,
      }
      await postFollowStreamer(input)
      const newPromotional = {
        ...streamerPromotional.value,
        isFollowed: bool,
      }
      streamStore.setStreamerPromotional(newPromotional)
      // 人工粉絲數
      if (streamerInfo.value?.fansCount != null) streamerInfo.value.fansCount += bool ? 1 : -1
    } catch (e) {
      console.log(e)
      ElMessage({
        showClose: true,
        message: t('追蹤失敗，請稍後再試'),
        type: 'error',
      })
    } finally {
      isLoading.value = false
    }
  }
  const copyAccount = account => {
    if (!account) return
    navigator.clipboard
      .writeText(account)
      .then(() => {
        ElMessage.success({ showClose: true, message: t('複製成功') })
      })
      .catch(() => {
        ElMessage.error({ showClose: true, message: t('複製失敗') })
      })
  }
  onUnmounted(() => {
    clearInterval(secondInterval.value)
  })
</script>

<style lang="scss">
  .darkDrawer.streamer-promotional.el-drawer {
    min-height: auto !important;
    border-radius: 15px;
    .el-drawer__body {
      padding: 0;

      .main-menu {
        padding: 0;
        .streamer-menu-btn {
          position: absolute;
          border-radius: 50%;
          padding: 0;
          width: 24px;
          height: 24px;
          line-height: 24px;
          color: white;
          background-color: #11172280;
          right: 15px;
          top: 12px;
        }
        .main-photos {
          height: 10svh;
          min-height: 60px;
          img {
            width: 100%;
            height: 10svh;
            min-height: 60px;
            object-fit: cover;
          }
        }
        .main-container {
          flex-grow: 1;
          padding: 0 20px;
          font-size: 12px;
          .info {
            display: flex;
            padding: 5px 0;
            align-items: start;
            .streamer-name {
              font-size: 14px;
            }
            .streamer-info {
              display: flex;
              color: #8094bb;
              font-size: 12px;
              align-items: flex-start;
              word-break: break-all;
              .el-divider {
                border-color: #8094bb;
                margin-top: 3px;
              }
              .fans {
                flex-shrink: 0;
              }
              button {
                padding: 2px 5px;
                margin: 0;
                line-height: 1em;
                display: block;
                background-color: transparent;
                color: #8094bb;
              }
            }

            .avatar {
              position: relative;
              margin-top: -20px;
              width: 60px;
              height: auto;
            }
            .streamer-title {
              padding-left: 10px;
              .streamer-name,
              .streamer-info {
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }
          }
          .info-room-name {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
          }
          .icon-live {
            background: linear-gradient(to left, #f54b64, #f78361);
            background: -webkit-linear-gradient(to left, #f54b64, #f78361);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            font-weight: bold;
            padding-right: 3px;
          }
          .online-members {
            display: inline-block;
            cursor: pointer;
          }
        }
        .follow-btn {
          background-color: #9b47ff;
          border-color: #9b47ff;
          color: white;
          border-radius: 50px;
          padding: 8px 25px;
          margin: 15px 20px;
          transition: 0.2s all ease;

          &.following {
            color: #8094bb;
            border-color: #8094bb;
            background-color: #292542;
          }
        }
      }
    }
  }
</style>
