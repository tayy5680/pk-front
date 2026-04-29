<template>
  <div class="view-notification" :class="{ mobile: isMobile }">
    <el-popover
      :popper-class="`px-0 notification-popover ${isMobile ? 'mobile' : ''}`"
      placement="bottom"
      :hide-after="0"
      trigger="click"
      :width="310"
      @show="actionPopoverVisible(true)"
      @hide="actionPopoverVisible(false)"
      :show-arrow="false"
    >
      <div class="text-center text-white h6 bell-title">{{ $t('通知') }}</div>
      <div class="scroll-noti">
        <div class="sub-title">{{ $t('最新通知') }}</div>
        <div
          class="noti-items"
          v-for="(item, index) in notiList"
          :key="index"
          @click="readNotification(index)"
          :class="{ 'delete-anim': item?.delete }"
        >
          <div class="items-img"><img :src="item.senderMemberId ? notiUserImg : notiSystemImg" /></div>
          <div class="items-content">
            <div class="close" @click="deleteNotification(index)"><i class="bi bi-x-lg"></i></div>
            <div class="msg">{{ item.message }}</div>
            <div class="d-flex">
              <div v-if="!item.isRead" class="dot" />
              <div class="time">{{ dayjs(item.created).fromNow() }}・</div>
              <div class="category-name">{{ item.categoryName }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #reference>
        <el-button class="bell-btn me-3" :class="[{ dot: isDotVisible }, { action: isPopoverVisible }]">
          <i class="bi bi-bell"></i>
        </el-button>
      </template>
    </el-popover>
  </div>
</template>

<script setup>
  import notiUserImg from '@/assets/image/menu/noti-user.png'
  import notiSystemImg from '@/assets/image/menu/noti-system.png'
  import { ref, watch, onMounted, computed } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { getMemberNotification, postMemberNotificationRead, postMemberNotificationDel } from '@/api/member.js'
  import dayjs from 'dayjs'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { useI18n } from 'vue-i18n'
  dayjs.extend(relativeTime)

  const defaultSettingStore = useDefaultSetting()
  const { isAppInitReady, isMobile } = storeToRefs(defaultSettingStore)
  const { locale, t } = useI18n()

  const isPopoverVisible = ref(false)
  const isDotVisible = computed(() => notiList.value.some(item => !item.isRead))
  const notiList = ref([])
  const notiTotalCount = ref(0)
  const actionPopoverVisible = bool => {
    isPopoverVisible.value = bool
    if (bool) getNotificationList()
  }

  const getNotificationList = async () => {
    try {
      const input = {
        lang: locale.value,
        page: 1,
        pageSize: 20,
      }
      const res = await getMemberNotification(input)
      notiList.value = res.data
      notiTotalCount.value = res.totalCount
    } catch (e) {
      console.warn(e)
    }
  }

  const readNotification = async index => {
    if (!notiList.value?.[index]) return
    if (notiList.value[index].isRead) return

    notiList.value[index].isRead = true
    try {
      await postMemberNotificationRead({ notificationId: notiList.value[index].notificationId })
    } catch (e) {
      console.warn(e)
    }
  }
  const deleteNotification = async index => {
    if (!notiList.value?.[index]) return
    notiList.value[index].delete = true
    try {
      await postMemberNotificationDel({ notificationId: notiList.value[index].notificationId })
    } catch (e) {
      console.warn(e)
    }
  }

  watch(isAppInitReady, () => {
    getNotificationList()
  })
</script>

<style lang="scss" scope>
  .el-popover.el-popper.notification-popover {
    // max-width: 310px !important;
    // width: 100% !important;
    background-color: #242937 !important;
    border: 1px solid #405277;
    border-radius: 15px !important;

    &.mobile {
      width: 100vw !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      min-width: 100vw;
      border: 0;
      overflow: hidden;
      border-radius: 0 !important;
      background-color: #1f2530 !important;

      .scroll-noti {
        max-height: 100%;
        padding: 10px 0px 30px 0px;
      }
    }

    .sub-title {
      color: #5a6b8d;
      border-top: 1px solid #5a6b8d;
      padding: 10px 15px;
      font-weight: bold;
    }
    .scroll-noti {
      max-height: 30svh;
      overflow-y: scroll;

      &::-webkit-scrollbar {
        width: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #667594; // #667594
        border-radius: 3px;
      }

      &::-webkit-scrollbar-track {
        background-color: transparent;
      }

      .noti-items {
        display: flex;
        align-items: center;
        cursor: default;
        padding: 15px;
        transition: 0.2s all ease;

        &.delete-anim {
          height: 0px;
          overflow: hidden;
          padding: 0 15px;
        }

        .items-img {
          transition: 0.2s all ease;
          background-color: #394254;
          height: 40px;
          width: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-right: 15px;
          display: flex;
          justify-content: center;
          align-items: center;
          img {
            width: 24px;
            height: 24px;
          }
        }

        .items-content {
          width: 100%;
          color: white;
          .msg {
            color: white;
          }
          .d-flex {
            user-select: none;
            align-items: center;
            .dot {
              height: 6px;
              width: 6px;
              background-color: var(--main-red);
              border-radius: 50%;
              margin-right: 6px;
            }
          }
        }

        .close {
          transition: 0.2s all ease;
          color: #9097ac;
          position: relative;
          right: -10px;
          margin-top: -10px;
          opacity: 1;
          cursor: pointer;
          text-align: right;
        }

        &:hover {
          background-color: #394254;

          .close {
            opacity: 1;
          }

          .items-img {
            background-color: #242b37;
          }
        }
      }
    }
  }

  .view-notification {
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
