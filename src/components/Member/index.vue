<template>
  <div class="page-member">
    <ViewHeader />
    <div class="container page-container" ref="pageContainer">
      <div class="member-title d-flex">
        <el-avatar :size="80" fit="cover" :src="memberInfo?.photoPath" :class="memberInfo?.photo?.frame ? 'me-5' : 'me-3'">
          <img :src="userPhoto" />
        </el-avatar>
        <img class="avatar-frame" :src="memberInfo?.photo?.frame" v-if="memberInfo?.photo?.frame" />
        <div class="flex-grow-1">
          <div class="name">{{ memberInfo?.memberName }}</div>
          <div class="follow" v-if="activeTabName">
            {{ playerFollowList.count }}<span>{{ $t('正在追蹤') }}</span>
          </div>
        </div>
      </div>
      <el-tabs v-if="activeTabName" v-model="activeTabName" class="demo-tabs">
        <el-tab-pane :label="$t('個人資料')" name="User">
          <ViewUserInfo />
        </el-tab-pane>
        <el-tab-pane :label="$t('追蹤名單')" name="FollowList">
          <ViewFollowList :playerFollowList="playerFollowList" />
        </el-tab-pane>
        <el-tab-pane :label="$t('抖內紀錄')" name="DonateRecord">
          <ViewDonateRecord :playerDonateRecordList="playerDonateRecordList" />
        </el-tab-pane>
        <el-tab-pane :label="$t('遊玩紀錄')" name="GameBetlog">
          <ViewGameBetlog />
        </el-tab-pane>
      </el-tabs>
      <div v-else class="loading">Loading...</div>
    </div>
  </div>
</template>

<script setup>
  import ViewFollowList from './FollowList/index.vue'
  import ViewDonateRecord from './DonateRecord/index.vue'
  import ViewUserInfo from './UserInfo/index.vue'
  import ViewGameBetlog from './GameBetlog/index.vue'
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, onMounted, watch, provide } from 'vue'
  import ViewHeader from '@/components/Header/index.vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useDonate } from '@/store/live.js'
  import { getPlayerDonateRecord, getPlayerFollowList } from '@/api/member.js'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  const donateStore = useDonate()
  const defaultSettingStore = useDefaultSetting()
  const { isAppInitReady, memberInfo } = storeToRefs(defaultSettingStore)
  const { t, locale } = useI18n()
  const isLoading = ref(false)
  provide('isLoading', isLoading)
  const activeTabName = ref('')
  provide('activeTabName', activeTabName)

  const init = async () => {
    activeTabName.value = ''
    if (!isAppInitReady.value) return
    try {
      // 1. 檢查錢包連線(currency, memberId)
      if (!donateStore.connectWallet && memberInfo.value.memberId)
        donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
      // 2. 取得玩家追蹤名單
      actionGetPlayerFollowList()
      // 3. 取得抖內紀錄
      actionGetPlayerDonateRecord()

      activeTabName.value = 'User'
    } catch (e) {
      console.warn(e)
    }
  }

  // 畫面閃爍效果ＣＳＳ
  const pageContainer = ref(null)
  const addFlashCss = () => {
    if (!pageContainer.value) return
    pageContainer.value.classList.add('flash-effect')
    setTimeout(() => {
      pageContainer.value.classList.remove('flash-effect')
    }, 500)
  }

  // 取得追蹤名單
  const playerFollowList = ref({
    count: 0,
    list: [],
  })
  const actionGetPlayerFollowList = async () => {
    try {
      playerFollowList.value = await getPlayerFollowList().then(res => res.data)
      playerFollowList.value.list.forEach(item => {
        item.isFollow = true
      })
    } catch (e) {
      playerFollowList.value = { count: 0, list: [] }
      ElMessage({
        showClose: true,
        message: t('追蹤名單取得失敗，請稍後再試'),
        type: 'error',
      })
    }
  }
  provide('actionGetPlayerFollowList', actionGetPlayerFollowList)

  // 取得抖內紀錄
  const playerDonateRecordList = ref([])
  const actionGetPlayerDonateRecord = async () => {
    try {
      // 2. 取得玩家追蹤名單
      playerDonateRecordList.value = await getPlayerDonateRecord({ lang: locale.value }).then(res => res.data)
    } catch (e) {
      playerDonateRecordList.value = []
      ElMessage({
        showClose: true,
        message: t('抖內紀錄取得失敗，請稍後再試'),
        type: 'error',
      })
    }
  }

  watch(isAppInitReady, val => {
    if (val) init()
  })

  onMounted(async () => {
    init()
  })
</script>
<style lang="scss" scoped>
  .page-member {
    color: white;

    .page-container {
      padding-top: 50px;

      &.flash-effect {
        animation: flash 0.5s ease-in-out;
      }
      @keyframes flash {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 100;
        }
      }
    }
    @media (min-width: 768px) {
      .page-container {
        max-width: 768px;
      }
    }

    .member-title {
      align-items: center;
      padding-bottom: 40px;

      .avatar-frame {
        position: absolute;
        width: 135px;
        height: 135px;
        margin-left: -28px;
        margin-top: 13px;
      }

      .upload-avatar {
        position: absolute;
        width: 80px;
        height: 80px;
        overflow: hidden;
        border-radius: 50%;
        opacity: 0.6;
        :deep(.el-upload) {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 80px;
          height: 80px;
          .el-upload-dragger {
            padding: 0;
            background-color: rgba(54, 61, 78, 0);
            width: 100%;
            border: 0;
            border-radius: 0;
            .upload-icon {
              background-color: rgba(0, 0, 0, 0.9);
              padding: 5px 0;
              i {
                color: var(--main-red);
              }
            }
          }
        }
      }

      .name {
        font-size: 24px;
        word-break: break-all;
      }

      .follow {
        span {
          color: var(--main-dark-text);
          padding-left: 5px;
        }
      }

      .edit-mode-btn {
        background-color: #363d4e;
        color: white;
        border: 0;
        transition: 0.2s all ease;
        padding: 25px 25px;
        border-radius: 50px;

        &:hover {
          background-color: #6a7a9d;
        }
        &:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0);
        }
        &.disabled {
          background-color: #363d4e;
          color: #6b7586;
          cursor: default;
        }
      }
    }

    :deep(.el-tabs) {
      .el-tabs__item {
        color: white;
      }
      .el-tabs__item.is-active {
        color: var(--main-red);
      }
      .el-tabs__active-bar {
        background-color: var(--main-red);
        height: 4px;
        border-radius: 30px;
      }
      .el-tabs__nav-wrap:after {
        background-color: var(--main-dark-text);
        height: 1px;
      }
      .el-tab-pane {
        padding: 20px 0;
      }
    }

    :deep(.el-avatar) {
      flex-shrink: 0;
    }

    .loading {
      text-align: center;
    }
  }
</style>
