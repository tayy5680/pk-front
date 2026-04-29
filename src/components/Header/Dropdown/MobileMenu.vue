<template>
  <div class="view-mobile-menu-dialog">
    <el-popover
      :popper-class="`px-0 mobile-menu-popover ${isMobile ? 'mobile' : ''}`"
      placement="bottom"
      :hide-after="0"
      trigger="click"
      @show="actionPopoverVisible(true)"
      @hide="actionPopoverVisible(false)"
      :show-arrow="false"
      ref="popoverRef"
    >
      <div class="top-member-info">
        <el-avatar class="mb-2" :size="100" :src="memberInfo?.photoPath" fit="cover">
          <img :src="userPhoto" />
        </el-avatar>
        <div class="wallet-point">
          <el-image :src="goldImg" fit="cover" />
          <span class="ps-2">{{ walletPoint }}</span>
        </div>
      </div>
      <div class="scroll-system">
        <div @click="goToMemberPage">{{ $t('玩家中心') }}</div>
        <div @click="goToSystemPage">{{ $t('設定') }}</div>
      </div>
      <template #reference>
        <el-button class="bell-btn" :class="[{ dot: isDotVisible }]">
          <i :class="`bi bi-${isPopoverVisible ? 'x-lg' : 'list'}`"></i>
        </el-button>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import { ref, watch, onMounted, computed } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useDonate } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { getMemberNotification, postMemberNotificationRead, postMemberNotificationDel } from '@/api/member.js'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { useI18n } from 'vue-i18n'
  import { useRouter, useRoute } from 'vue-router'
  dayjs.extend(relativeTime)

  const router = useRouter()
  const defaultSettingStore = useDefaultSetting()
  const { isAppInitReady, isMobile, memberInfo } = storeToRefs(defaultSettingStore)
  const donateStore = useDonate()
  const { walletPoint } = storeToRefs(donateStore)
  const { locale, t } = useI18n()

  const isPopoverVisible = ref(false)
  const isDotVisible = computed(() => notiList.value.some(item => !item.isRead))
  const notiList = ref([])
  const notiTotalCount = ref(0)
  const actionPopoverVisible = bool => {
    isPopoverVisible.value = bool
  }

  const popoverRef = ref(null)
  const goToMemberPage = () => {
    popoverRef.value.hide()
    router.push(`/Member${window.location.search}`)
  }

  const goToSystemPage = () => {
    popoverRef.value.hide()
    router.push(`/system${window.location.search}`)
  }
</script>

<style lang="scss" scope>
  .mobile-menu-popover {
    width: 100vw !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    min-width: 100vw;
    border: 0 !important;
    overflow: hidden;
    border-radius: 0 !important;
    background-color: #1f2530 !important;

    .top-member-info {
      border-bottom: 1px solid #5a6b8d;
      padding-bottom: 30px;
      text-align: center;
      color: white;
      font-size: 18px;
      .wallet-point {
        border: 1px solid #405277;
        border-radius: 50px;
        margin: 0;
        display: flex;
        align-items: center;
        padding: 6px 6px;
        min-width: 200px;
        width: 70vw;
        margin: 0 auto;
        justify-content: center;

        .el-image {
          width: 20px;
          height: 20px;
        }
      }
    }
    .scroll-system {
      overflow-y: scroll;
      max-height: 100%;
      padding: 30px 0px;

      &::-webkit-scrollbar {
        width: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #667594;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      > div {
        cursor: pointer;
        color: white;
        text-align: center;
        padding: 10px;
        margin-bottom: 10px;
        transition: 0.2s color ease;
        font-size: 16px;
        &:hover {
          color: #8a9ecc;
        }
      }
    }
  }

  .view-mobile-menu-dialog {
    max-height: 30svh;
    .bell-btn {
      background-color: #ffffff00;
      color: white;
      font-size: 16px;
      border: 0;
      font-size: 25px;
      padding: 18px 5px;
      width: 36px;
      height: 36px;
      margin: 0;

      &:hover,
      &.action {
        background-color: #3a4359;
      }
      &.dot::after {
        content: '';
        height: 10px;
        width: 10px;
        background-color: var(--main-red);
        border-radius: 50%;
        position: absolute;
        margin: 0 -15px -15px 0;
      }
    }
  }
</style>
