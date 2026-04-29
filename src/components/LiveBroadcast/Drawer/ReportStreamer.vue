<template>
  <el-drawer
    class="darkDrawer report-streamer"
    v-model="drawerList.reportStreamer"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    size="70%"
  >
    <div class="main-title">
      <button v-if="activePath.length && !finalData.isSubmitSuccess" class="back" @click="backPath">
        <i class="bi bi-chevron-left"></i>
      </button>
      <div>{{ $t('檢舉{userName}', { userName: channelData?.name ?? '-' }) }}</div>
    </div>
    <div class="main-menu">
      <!-- 主選單 -->
      <div class="list" :class="{ hidding: showSubMenu }">
        <p class="sub-title">{{ $t('選擇您要檢舉的項目') }}</p>

        <div v-for="(item, index) in mainList" :key="index" @click="addPath(item, index)" class="list-item">
          <div class="flex-grow-1">{{ item.name }}</div>
          <i v-if="item?.submenu?.length" class="bi bi-chevron-right me-0"></i>
        </div>
      </div>
      <!-- 檢舉細項 -->
      <div class="sub-list" :class="{ show: showSubMenu }">
        <transition mode="out-in" @before-enter="beforeEnter" @enter="enter" @leave="leave" :css="false">
          <div :key="activePath.join('-')" class="sub-list-content">
            <p class="sub-title">
              {{
                activePath.length <= 1 || !activeItem?.name
                  ? $t('您的檢舉事由為？')
                  : $t(`屬於 {item} 的原因是?`, { item: activeItem.name })
              }}
            </p>
            <div class="scroll-area">
              <div
                v-for="(item, level) in activeItem?.submenu || []"
                :key="level"
                @click="selectedReportOption = { index: level, item: item }"
              >
                {{ item.name }}
                <i :class="`bi ${selectedReportOption.index === level ? 'bi-record-circle active' : 'bi-circle'}`"></i>
              </div>
              <!-- 其他違規 -->
              <div v-if="activeItem?.id === OTHER_REPORT_ITEMS_ID" class="other-reason" :class="{ red: otherReason.length > 50 }">
                <el-input
                  v-model="otherReason"
                  :autosize="{ minRows: 7, maxRows: 5 }"
                  type="textarea"
                  :placeholder="$t('請描述本場直播違規的原因')"
                  @input="vaildOtherReason"
                />
                <div class="word-count">({{ otherReason.length }}/50)</div>
              </div>
            </div>
            <el-button
              round
              class="next-btn"
              @click="addPath(selectedReportOption.item, selectedReportOption.index)"
              :disabled="selectedReportOption.index < 0"
            >
              {{ $t('下一步') }}
            </el-button>
          </div>
        </transition>
      </div>

      <!-- 終選單 -->
      <div class="sub-list final" :class="{ show: isFinal }">
        <div v-if="!finalData.isSubmitSuccess">
          <p class="sub-title">{{ $t('您即將對 {userName} 提出檢舉', { userName: channelData?.name ?? '-' }) }}</p>
          <div class="final-reason-list">
            <div>
              <span>{{ $t('檢舉項目') }}</span
              >{{ finalData.reportItem.name }}
            </div>
            <div>
              <span>{{ $t('檢舉事由') }}</span
              >{{ finalData.reasonForReport.name }}
            </div>
            <div>
              <span>{{ $t('檢舉原因') }}</span
              ><small>{{ finalData.causeOfReport.name }}</small>
            </div>
          </div>
          <el-button round class="submit-btn" @click="submitViolationAccuse">
            {{ $t('提交') }}
          </el-button>
        </div>
        <div v-else class="submit-success">
          <img :src="getUrl('submitSuccess.png')" />
          <p>{{ $t('感謝您提出的檢舉') }}</p>
          <p>
            <small>{{ $t('我們會盡快進行審核與調查。') }}</small>
          </p>
          <el-button round class="submit-btn" @click="closeDrawer">
            {{ $t('完成') }}
          </el-button>
        </div>
      </div>
      <!-- submitSuccess.png -->
    </div>
  </el-drawer>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import defaultPhoto2 from '@/assets/image/hall/default_photo_2.svg'
  import { inject, ref, watch, onMounted, computed } from 'vue'
  import { getViolationCategories, postViolationAccuse } from '@/api/stream.js'
  import { useStream } from '@/store/live.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import ViewStreamerPromotional from '@/components/StreamerPromotional/index.vue'
  import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()
  const streamStore = useStream()
  const { channelData, streamerPromotional, onlineMembers } = storeToRefs(streamStore)
  const defaultSettingStore = useDefaultSetting()
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')
  const streamerInfo = inject('streamerInfo')
  const isLoading = ref(false)
  const showSubMenu = ref(false)
  // 其他違規的id是48
  const OTHER_REPORT_ITEMS_ID = 48

  const closeDrawer = () => {
    setDrawer('reportStreamer', false)
    showSubMenu.value = false
  }

  watch(
    () => drawerList.value.reportStreamer,
    val => {
      if (val) {
        finalData.value = {
          reportItem: { index: -1, name: '' },
          reasonForReport: { index: -1, name: '' },
          causeOfReport: { index: -1, name: '' },
          accuseId: 0,
          isSubmitSuccess: false,
          violationOptionId: 0, // 違規項目Id 1= Live直播, 2 = 使用者 (大頭貼、封面照、宣傳圖等)
        }
        otherReason.value = ''
        if (!defaultSettingStore.memberInfo.memberId) {
          ElMessageBox.alert(t('登入或註冊後即可使用此功能'), t('通知'), {
            confirmButtonText: t('確認'),
            showClose: false,
          })
          closeDrawer()
          return
        }

        if (Object.keys(channelData.value).length === 0) {
          ElMessage.warning({ message: t('直播主資料取得異常') })
          closeDrawer()
          return
        }
        init()
      }
    },
  )
  const getUrl = filename => {
    return new URL(`/src/assets/image/streamerPromotional/${filename}`, import.meta.url).href
  }

  const MAIN_LIST = [
    { id: 'user', name: '使用者 (大頭貼、封面照、宣傳圖等)', submenu: [] },
    {
      id: 'live',
      name: 'LIVE 直播',
      submenu: [],
    },
  ]
  const mainList = ref([])
  const init = async () => {
    try {
      isLoading.value = true
      const res = await getViolationCategories({ lang: locale.value }).then(res => res.data)
      mainList.value = Object.entries(res).map(([key, value]) => ({
        id: key,
        ...value,
        submenu: value.list ?? [],
      }))
    } catch (e) {
      console.error(e)
      mainList.value = []
      ElMessage.error({ message: t('發生未知錯誤，請稍後再試。') })
    } finally {
      isLoading.value = false
    }
  }
  // 最終傳遞資料
  const finalData = ref({
    reportItem: { index: -1, name: '' },
    reasonForReport: { index: -1, name: '' },
    causeOfReport: { index: -1, name: '' },
    accuseId: 0,
    isSubmitSuccess: false,
  })
  // 單選題和其他違規中暫時選擇的項目
  const selectedReportOption = ref({ index: -1, item: null })
  // 計算：目前選擇的項目路徑index
  const activePath = computed(() => {
    return [finalData.value.reportItem.index, finalData.value.reasonForReport.index, finalData.value.causeOfReport.index].filter(
      i => i !== -1,
    )
  })
  // 計算：是否為最終步驟
  const isFinal = computed(() => {
    return Object.values(finalData.value).every(item => item.index !== -1)
  })
  // 計算：目前步驟中的內容
  const activeItem = computed(() => {
    return activePath.value.reduce((acc, cur) => {
      if (!acc) return null
      return acc.submenu ? acc.submenu[cur] : acc[cur]
    }, mainList.value)
  })

  // 其他違規項目
  const otherReason = ref('')
  const vaildOtherReason = () => {
    selectedReportOption.value = {
      index: otherReason.value.trim() && otherReason.value.length <= 50 ? 9999 : -1,
      item: { name: otherReason.value },
    }
  }
  // 回上一步
  const backPath = () => {
    const finalKeys = Object.keys(finalData.value)
    if (!activePath.value.length) return
    if (activePath.value.length === 1) showSubMenu.value = false

    const key = finalKeys[activePath.value.length - 1]
    finalData.value[key] = { index: -1, name: '' }
    selectedReportOption.value = { index: -1, name: '' }

    // 返回輸入『其他原因』時保留內容
    if (activeItem.value?.type === 'textarea') vaildOtherReason()
  }
  // 下一步
  const addPath = (item, index) => {
    showSubMenu.value = true
    const finalKeys = Object.keys(finalData.value)
    const key = finalKeys[activePath.value.length]
    finalData.value[key] = { index, name: item.name }
    selectedReportOption.value = { index: -1, name: '' }
    finalData.value.accuseId = item?.id ?? 999
    // 進入『其他原因』時清除內容
    if (activeItem.value?.type === 'textarea') otherReason.value = ''
    // violationOptionId違規項目Id: 1= Live直播, 2 = 使用者 (大頭貼、封面照、宣傳圖等)
    if (item.violationOptionId) finalData.value.violationOptionId = item.violationOptionId
  }

  // 提交
  const submitViolationAccuse = async () => {
    if (isLoading.value) return
    try {
      isLoading.value = true
      const input = {
        userId: channelData.value.userId,
        streamChannelId: channelData.value.streamChannelId,
        id: finalData.value.accuseId,
        cause: finalData.value.causeOfReport.name,
        violationOptionId: finalData.value.violationOptionId,
      }
      const res = await postViolationAccuse(input)

      if (res?.Status?.Code === '4001') {
        ElMessageBox.alert(t('您已經提交過檢舉'), t('通知'), {
          confirmButtonText: t('確認'),
          showClose: false,
        })
        closeDrawer()
        return
      }
      finalData.value.isSubmitSuccess = true
    } catch (e) {
      console.error(e)
      ElMessage.error({ message: t('發生未知錯誤，請稍後再試。') })
      closeDrawer()
    } finally {
      isLoading.value = false
    }
  }
  //= transition 效果====
  const changeKey = ref(0)
  const showMain = ref(true)
  const beforeEnter = el => {
    el.style.opacity = '0' // 初始狀態應該是透明
  }
  const enter = (el, done) => {
    el.style.transition = 'opacity 0.2s'
    requestAnimationFrame(() => {
      el.style.opacity = '1'
    })
    setTimeout(done, 300)
  }
  const leave = (el, done) => {
    el.style.transition = 'opacity 0.2s'
    el.style.opacity = '0'
    setTimeout(done, 300)
  }

  watch(
    () => activePath,
    () => {
      changeKey.value++
      showMain.value = false
      setTimeout(() => {
        showMain.value = true
      }, 50)
    },
  )
  //======
</script>

<style lang="scss">
  .darkDrawer.report-streamer.el-drawer {
    min-height: auto !important;
    border-radius: 15px;
    .el-drawer__body {
      padding: 0;
      .main-menu {
        padding: 60px 0px 12px 0px;
        background-color: #263045;

        .sub-title {
          color: #8094bb;
          font-size: 14px;
          padding: 0px 20px;
          margin-bottom: 5px;
        }
        .list {
          left: 0;
          flex-basis: content;
          &.hidding {
            left: -100%;
          }

          > div {
            padding: 10px 20px;
            border-radius: 0;
            transition: background-color 0.2s ease;
            &:hover {
              background-color: #5a6b8d;
            }

            .bi-chevron-right {
              font-size: 16px;
              line-height: 20px;
              text-align: right;
              padding-left: 5px;
            }
          }
        }

        .sub-list {
          transition: 0.2s all ease;
          right: -100%;
          position: absolute;
          width: 100%;
          flex-grow: 1;
          bottom: 0;
          height: calc(100% - var(--main-title-height));
          overflow-y: scroll;

          &.show {
            right: 0;
          }

          &.final {
            background-color: #263045;
            display: flex;
            flex-direction: column;
            padding: 0 20px;
            .sub-title {
              padding: 10px 0px;
            }
            .final-reason-list {
              flex-grow: 1;
              overflow-y: scroll;
              scrollbar-width: none;

              > div {
                border: 1px solid #8094bb;
                border-radius: 8px;
                padding: 10px 20px;
                margin-bottom: 8px;

                span {
                  color: #8094bb;
                  font-size: 14px;
                  display: flex;
                }
                small {
                  font-size: 14px;
                }
              }
            }
            .submit-btn {
              width: 100%;
              margin: 15px 0;
              border: 0;
              transition: all 0.2s ease;
              background-color: #9b47ff;
              color: white;
            }
            .submit-success {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin-bottom: 50px;
              > img {
                width: 50%;
                height: auto;
                margin-bottom: 20px;
              }
              p {
                font-size: 14px;
                margin-bottom: 0px;
              }
              small {
                font-size: 12px;
                color: #8094bb;
              }
              button {
                position: absolute;
                bottom: 0;
                width: calc(100% - 40px);
              }
            }
          }
          .sub-list-content {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 0 20px;
            .sub-title {
              flex-shrink: 0;
              padding: 10px 0px;
            }
            .scroll-area {
              overflow-y: scroll;
              scrollbar-width: none;
              flex-grow: 1;
              > div {
                padding: 8px 0;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                .active {
                  color: #9b47ff;
                }
              }

              .other-reason {
                flex-direction: column;
                textarea {
                  background-color: #37435b;
                  border: 0;
                  box-shadow: none;
                  border-radius: 8px;
                  color: white;
                  --el-input-placeholder-color: #5a6b8d;
                }
                .word-count {
                  color: #8094bb;
                }
                &.red {
                  textarea {
                    box-shadow: 0 0 0 1px #e03445 inset;
                  }
                  .word-count {
                    color: #e03445;
                  }
                }
              }
            }
            .next-btn {
              width: 100%;
              margin: 15px 0;
              border: 0;
              transition: all 0.2s ease;
              background-color: #9b47ff;
              color: white;
              &.is-disabled {
                background-color: #37435b;
                color: #5d6a89;
              }
            }
          }
        }
      }
    }
  }
</style>
