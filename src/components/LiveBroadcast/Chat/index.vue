<template>
  <div class="live-chat">
    <div class="chat-msg-area" :style="`opacity:${isDanmakuVisible ? 100 : 0}`">
      <div id="donateMp4"></div>
      <!-- 抖內資訊 -->
      <div class="donate-msg-list" ref="donateListRef"></div>
      <!-- 普通留言 -->
      <div class="normal-msg-list" :class="{ maskOpacity: donateMessageList.length === 0 }">
        <div
          v-for="(msgItem, index) in normalMessageList"
          :key="index"
          class="chat-msg-item"
          :class="{ donate: msgItem?.isDonate }"
        >
          <el-avatar class="user-avatar" fit="cover" :src="msgItem.avatar">
            <img :src="userPhoto" />
          </el-avatar>
          <img class="avatar-frame" :src="msgItem?.avatarFrame" v-if="msgItem?.avatarFrame" />
          <div class="name-text">
            <div class="name">{{ msgItem.name }}</div>
            <div v-if="msgItem?.isDonate" class="text">
              <img :src="getUrl(`i_donate_items_${msgItem.optionCategoryId}.svg`)" />
              <div
                v-html="
                  `${$t('贈送了{name}', {
                    name: `<span style='color:rgba(${getRGB(msgItem?.optionCategoryId).toString()},1)'>  ${msgItem.itemName}</span>`,
                  })}`
                "
              ></div>
            </div>
            <div v-else class="text">{{ msgItem.text }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <div class="input-alert" v-if="message.length > 100">
        <div>{{ $t('文字長度過長') }} {{ message.length > 999 ? '999+' : message.length }}/100</div>
      </div>
      <div
        class="input"
        v-if="!isMemberChatDisabled"
        :class="[{ 'opacity-50': !chatSuccess }, { tooLong: message.length > 100 }]"
        @click="checkReadOnly"
      >
        <el-input
          v-model="message"
          :placeholder="`${$t('加入一起聊天')}...`"
          :disabled="!chatSuccess"
          @keydown.enter="submitMessage"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        >
          <template #append v-if="message">
            <img class="submit_btn" @click="submitMessage" :src="getUrl('i_send.png')" />
          </template>
        </el-input>
      </div>
      <div v-else class="input">
        <el-input :placeholder="`${$t('您已被禁言')}`" disabled> </el-input>
      </div>
      <div class="donate_btn" :class="{ 'd-sm-none': !isMobile }">
        <img @click="actionDonateBtn" :src="getUrl('i_donate.png')" />
      </div>
      <div class="heart_btn">
        <img @click="sendLove" :src="getUrl('i_like.png')" />
      </div>
      <div class="heart-area" ref="heartArea"></div>
    </div>
  </div>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, watch, onMounted, nextTick, computed, onUnmounted, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import { Promotion } from '@element-plus/icons-vue'
  import { storeToRefs } from 'pinia'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useChat, useStream, useDonate } from '@/store/live.js'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { getRGB } from '../donateCss.js'

  //  YYEVA
  import { yyEva } from 'yyeva'
  const { t } = useI18n()
  const router = useRouter()
  const setDrawer = inject('setDrawer')
  const handleLoginRedirect = inject('handleLoginRedirect')
  const chatStore = useChat()
  const streamStore = useStream()
  const donateStore = useDonate()
  const defaultSettingStore = useDefaultSetting()
  const {
    receivedMsgData,
    isDanmakuVisible,
    chatSuccess,
    donateMsgData,
    receiveLoveTime,
    isDonateSuccessMessageVisible,

    memberKickoutStatus,
    memberChatStatus,
  } = storeToRefs(chatStore)

  const { isInitReady, donateOptionsList, isVideoMuted } = storeToRefs(streamStore)
  const { isMobile, memberInfo } = storeToRefs(defaultSettingStore)
  const isComposing = ref(false)

  // 禁言監聽
  const isMemberChatDisabled = computed(() => {
    const status = memberChatStatus.value
    const memberId = memberInfo.value?.memberId
    return status?.MemberId === memberId && !!status?.IsChatDisabled
  })
  watch(isMemberChatDisabled, val => {
    ElMessageBox.alert(val ? t('您已被禁言') : t('您已被解除禁言'), t('通知'), {
      confirmButtonText: t('確認'),
      showClose: false,
    })
  })

  // 踢出監聽
  const isMemberKickout = computed(() => {
    const status = memberKickoutStatus.value
    const memberId = memberInfo.value?.memberId
    return status?.MemberId === memberId && !!status?.IsKickout
  })
  watch(isMemberKickout, val => {
    if (!val) return
    router.push('/')
    ElMessageBox.alert(t('您已被踢出房間'), t('通知'), {
      confirmButtonText: t('確認'),
      showClose: false,
    })
  })

  const actionDonateBtn = () => {
    setDrawer('donate', true)
  }

  const normalMessageList = ref([])
  const donateMessageList = ref([])

  const getUrl = filename => {
    return new URL(`/src/assets/image/donate/${filename}`, import.meta.url).href
  }

  const message = ref('')
  const submitMessage = async () => {
    if (!memberInfo?.value?.memberId) return handleLoginRedirect()
    if (!message.value) return
    if (isComposing.value) return
    if (message.value.length > 100) return

    // 判斷chat有沒有連接上
    if (!chatSuccess.value) {
      ElMessage.warning({
        message: `${t('聊天室重新連線中')}......`,
        duration: 3000,
      })
      await chatStore.initConnectChatSignalR()
      return
    }

    // 確認一次wallet連線
    if (!donateStore.walletSuccess) {
      ElMessage.warning({ message: `${t('錢包重新連線中')}......` })
      await donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
      return
    }

    chatStore.sendMessage(message.value)
    message.value = ''
  }

  // websocket-普通留言
  watch(receivedMsgData, val => {
    nextTick(() => {
      const data = {
        avatar: val.PhotoPath ?? userPhoto,
        name: val.MemberName ?? '',
        text: val.Message ?? '',
        avatarFrame: val.Frame,
      }
      addNormalMessage(data)
    })
  })
  const addNormalMessage = data => {
    normalMessageList.value.push(data)
    if (normalMessageList.value.length > 10) normalMessageList.value.shift()
  }
  // websocket-抖內留言
  const donateListRef = ref(null)
  watch(donateMsgData, val => {
    const items = donateOptionsList.value.find(x => x.optionId === val.OptionId)
    const inputDanmaku = {
      avatar: val.PhotoPath ?? userPhoto,
      name: val.MemberName ?? '',
      text: t('贈送了{name}', { name: val.Name }),
      avatarFrame: val.Frame,
      isDonate: true,
      itemName: val.Name,
      donateIconUrl: val?.IconUrl ?? '',
      memberId: val.DonorMemberId,
      optionCategoryId: items?.optionCategoryId ?? 1,
    }
    actionDonateMessage(inputDanmaku)

    // 取得動畫
    if (!items) return
    if (items?.videoUrl) {
      videoPlayerConfig.value = {
        name: inputDanmaku.name,
        mp4: items.videoUrl,
        optionCategoryId: inputDanmaku.optionCategoryId,
        text: inputDanmaku.text,
      }
      donateYYEVAList.value.push(videoPlayerConfig.value)
      if (donateYYEVAList.value.length === 1) return playYYEVA(videoPlayerConfig.value)
      else return
    }
    // 暫時不會用到的ＧＩＦ
    if (items?.gif) return playGIF(items.gif)
  })
  // 處理抖內留言 1.留言區版本 ＋ 2.動畫效果的版本
  const actionDonateMessage = (donateData, isAddNormalMsg = true) => {
    // 1. 加入普通留言區的抖內留言
    if (isAddNormalMsg) addNormalMessage(donateData)

    // 2. 動畫效果的版本(淡入淡出)，如果還在播其他動畫就排隊
    if (donateListRef.value.children.length >= 1) return donateMessageList.value.push(donateData)
    const newDiv = document.createElement('div')
    newDiv.style.background = 'linear-gradient(to right, #211f3dbf, #7884aabf)'
    newDiv.style.display = 'flex'
    newDiv.style.marginBottom = '5px'
    newDiv.style.borderRadius = '100px'
    newDiv.style.alignItems = 'center'
    newDiv.style.padding = '3px'
    newDiv.style.transition = 'all 0.2s ease'
    newDiv.style.position = 'relative'
    newDiv.style.animation = 'fadeInOut 3s'
    newDiv.style.zIndex = '4'
    newDiv.style.opacity = '0'
    newDiv.innerHTML = `
            <img src="${donateData?.avatar ?? userPhoto}" style="border-radius: 50%; object-fit: cover;flex-shrink: 0; height: 24px; width: 24px; margin-right: 5px;"/>
            ${donateData?.avatarFrame ? `<img src="${donateData.avatarFrame}" style="position: absolute; width: 44px; margin-left: -10px; margin-top: 4px;"/>` : ''}
            <div style="width: 100%; color: white; overflow: hidden;">
              <div style="font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;padding-bottom: 2px;"> ${donateData.name} </div>
              <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${donateData.text}</div>
            </div>
         `
    if (donateData?.donateIconUrl)
      newDiv.innerHTML += `<img src="${donateData.donateIconUrl}" style="border-radius: 50%; object-fit: cover;flex-shrink: 0; height: 24px; width: 24px; margin-left: 5px;" />`

    donateListRef.value.appendChild(newDiv)

    // 4秒後消失
    setTimeout(() => {
      newDiv.remove()
      if (donateMessageList.value.length) actionDonateMessage(donateMessageList.value[0], false)
      donateMessageList.value.shift()
    }, 4000)
  }

  // 抖內動畫 YYEVA
  const donateYYEVAList = ref([])
  const videoPlayerRef = ref(null)
  const videoPlayerConfig = ref({
    text: '',
    name: '',
    mp4: '',
  })
  const playYYEVA = async ({ name, mp4, text, optionCategoryId }) => {
    let container = document.getElementById('donateMp4')

    //  如果目前有正在播放的動畫，不播放新動畫
    if (container.innerHTML) return
    container.style.width = '100%'

    videoPlayerRef.value = await yyEva({
      container: container,
      videoUrl: mp4,
      renderType: 'webgl',
      alphaDirection: 'right',
      useMetaData: true,
      useFrameCache: false,
      useVideoDBCache: false,
      videoID: new Date().getTime(),
      loop: false,
      mute: isVideoMuted.value,
      effects: {
        name: name ?? '',
        gift: text ?? '',
      },
      onRequestClickPlay() {
        videoPlayerRef.value.play()
      },
      onError() {
        videoPlayerRef.value.stop()
        videoPlayerRef.value.destroy()
        handleNext()
      },
      onEnd() {
        // 動畫結束，如果動畫列表中有等待播放的動畫，則播放它
        handleNext()
      },
    })
    const handleNext = () => {
      donateYYEVAList.value.shift()
      if (donateYYEVAList.value.length > 0) playYYEVA(donateYYEVAList.value[0])
    }
    videoPlayerRef.value.start()
  }
  watch(isVideoMuted, val => {
    let container = document.getElementById('donateMp4')
    if (container.innerHTML) playYYEVA(videoPlayerConfig.value)
  })

  // 愛心
  const heartArea = ref(null)
  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    return `rgba(${r}, ${g}, ${b}, 0.8)`
  }
  const actionHeart = () => {
    if (heartArea.value) {
      const newDiv = document.createElement('div')
      newDiv.className = 'live-heart-anim'
      newDiv.innerHTML = `<i class="bi bi-heart-fill" style="color:${getRandomColor()}"></i>`
      heartArea.value.appendChild(newDiv)

      setTimeout(() => {
        if (heartArea.value.contains(newDiv)) {
          heartArea.value.removeChild(newDiv)
        }
      }, 800)
    }
  }

  const testC = ref(1)
  const sendLove = () => {
    if (!memberInfo?.value?.memberId) return handleLoginRedirect()
    actionHeart()
    chatStore.sendLove()
  }
  watch(receiveLoveTime, val => {
    actionHeart()
  })

  onUnmounted(() => {
    chatStore.stopConnectChat()
  })

  // GIF
  const playGIF = gifUrl => {
    let container = document.getElementById('donateMp4')
    if (container.innerHTML) {
      videoPlayerRef.value.stop()
      videoPlayerRef.value.destroy()
      container.innerHTML = ''
      playGIF(gifUrl)
      return
    }
    const img = document.createElement('img')
    img.src = gifUrl
    img.alt = 'GIF Image'
    img.style.maxWidth = '100%'
    container.appendChild(img)
    setTimeout(() => {
      container.innerHTML = ''
    }, 5000)
  }

  // 唯讀模式判定
  const checkReadOnly = () => {
    if (!memberInfo?.value?.memberId) handleLoginRedirect()
  }
</script>

<style lang="scss" scoped>
  #donateMp4 {
    position: absolute;
    bottom: 84px;
    right: 0;
    width: 49%;
    display: flex;
    align-items: flex-end;
    z-index: 2;
    pointer-events: none;
  }
  .live-chat {
    position: relative;
    z-index: 10;
    width: 100%;
    bottom: 0;
    pointer-events: none;
    background: linear-gradient(to top, #1f2530db 20%, transparent 80%);

    .chat-msg-area {
      height: calc(35svh - 84px);
      width: 100%;
      display: flex;
      flex-direction: column;
      .normal-msg-list {
        overflow: hidden;
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        justify-content: flex-end;
        height: 100%;
        width: 51%;
        font-size: 10px;
        word-break: break-all;
        text-shadow: 0px 0px 4px #000000;
        -webkit-mask-image: linear-gradient(to top, black 90%, transparent 100%);
        mask-image: linear-gradient(to top, #000000 90%, transparent 100%);
        .chat-msg-item {
          display: flex;
          margin-bottom: 2px;
          align-items: flex-start;
          padding: 2px 0;
          .user-avatar {
            flex-shrink: 0;
            height: 24px;
            width: 24px;
            margin: 3px 10px 3px 8px;
          }
          .avatar-frame {
            position: absolute;
            width: 44px;
            height: 44px;
            margin-top: -5px;
            margin-left: -2px;
          }
          .name-text {
            width: 100%;
            color: white;
            .name {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-weight: bold;
              padding-bottom: 2px;
            }
          }

          &.donate {
            align-items: center;
            padding: 3px;
            margin: 0 0 3px 5px;
            .user-avatar {
              margin: 0 10px 0 0;
            }
            .avatar-frame {
              margin-top: 2px;
              margin-left: -10px;
            }
            .name-text {
              .text {
                padding: 1px 3px;
                border-radius: 3px;
                background: linear-gradient(to right, #191919, #19191999);
                display: flex;
                width: fit-content;
                justify-content: center;
                align-items: center;
                img {
                  height: 12px;
                  width: 12px;
                  margin-right: 5px;
                }
              }
            }

            .item-avatar {
              border-radius: 50%;
              object-fit: cover;
              flex-shrink: 0;
              height: 24px;
              width: 24px;
              margin-left: 5px;
            }
          }
        }

        &.maskOpacity {
          -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);
          mask-image: linear-gradient(to top, #000000 80%, transparent 100%);
        }
      }

      .donate-msg-list {
        font-size: 10px;
        padding: 0 0 0 5px;
        line-height: 12px;
        width: 51%;

        .donate-msg-item {
          display: flex;
          margin-bottom: 5px;
          background-color: cornflowerblue;
          border-radius: 100px;
          align-items: center;
          padding: 3px;
          transition: 0.2s all ease;
          position: relative;

          .user-avatar {
            flex-shrink: 0;
            height: 24px;
            width: 24px;
            margin-right: 5px;
          }
          .item-avatar {
            flex-shrink: 0;
            height: 24px;
            width: 24px;
            margin-left: 5px;
          }

          .name-text {
            width: 100%;
            color: white;
            overflow: hidden;
            .name {
              font-weight: bold;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .text {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
        }
      }
    }

    .chat-input {
      display: flex;
      align-items: flex-start;
      padding: 10px 10px;
      pointer-events: all;
      height: 84px;

      .input {
        flex-grow: 1;
        background-color: #4e586e;
        padding: 6px 8px;
        border-radius: 50px;

        &.tooLong {
          border: 1px solid var(--main-red);
        }

        :deep(.el-input) {
          background-color: #00000000;

          .el-input-group__append,
          .el-input__wrapper {
            background-color: #00000000;
            box-shadow: none;
          }

          .el-input-group__append {
            padding: 0;
          }
          .el-input__inner {
            color: white;
          }
        }
      }

      .submit_btn {
        height: 34px;
        width: 34px;
        flex-shrink: 0;
      }

      .heart_btn,
      .donate_btn {
        cursor: pointer;
        background-color: #4e586e;
        padding: 5px;
        border-radius: 50%;
        margin-left: 8px;
        position: relative;
        z-index: 1;
        height: 40px;
        width: 40px;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
        }
      }
    }
    .heart-area {
      position: relative;
      left: -30px;
      top: -15px;
    }
  }
</style>
<style lang="scss">
  @keyframes fadeInOut {
    0% {
      opacity: 0;
    }
    12.5% {
      /* 0.5s / 4s = 12.5% */
      opacity: 1;
    }
    87.5% {
      /* 保持 opacity: 1 到 3.5s */
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .live-heart-anim {
    position: fixed;
    opacity: 1;
    animation: heartmove 1s normal forwards;
    z-index: 3;

    &:after {
      top: -5px;
    }
    &::before {
      left: -5px;
    }
    i {
      font-size: 20px;
    }
  }
  @keyframes heartmove {
    100% {
      transform: translateY(-100px) scale(1.5);
      opacity: 0;
    }
    60% {
      transform: translateY(-100px) scale(1.5);
      opacity: 1;
    }
  }

  .input-alert {
    color: white;
    position: fixed;
    width: calc(100% - 20px);
    text-align: center;
    margin-top: -100px;
    font-size: 14px;
    white-space: nowrap;

    > div {
      background-color: var(--main-red);
      padding: 2px 15px;
      border-radius: 55px;
      display: inline-block;
    }
  }
</style>
