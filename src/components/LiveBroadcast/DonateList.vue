<template>
  <div class="donate-list" :class="{ isMobile: isMobile }">
    <div class="sticky-top">
      <div>{{ $t('傳送禮物') }}</div>
    </div>
    <div class="donate-category">
      <div
        v-for="(item, index) in donateCategoryList"
        :key="index"
        class="donate-category-item"
        :class="{ active: actionCategoryId === item.optionCategoryId }"
        @click="actionCategoryId = item.optionCategoryId"
      >
        <img v-if="item.optionCategoryId !== 0" :src="getUrl(`i_donate_items_${item.optionCategoryId}.svg`)" />
        {{ $t(item.label) }}
      </div>
    </div>
    <div class="donate-items-area row" v-if="donateOptionsList?.length">
      <div
        class="donate-items col-4"
        v-for="(item, index) in donateOptionsList"
        :key="index"
        @click="submit(item, index)"
        :class="{ 'd-none': actionCategoryId > 0 && actionCategoryId !== item?.optionCategoryId }"
      >
        <el-avatar :size="50" fit="cover" :src="item?.iconUrl" />
        <small class="name" :style="`background-color: rgb(${getRGB(item?.optionCategoryId).toString()})`">
          {{ item?.name ?? '' }}
          <br v-if="(item.name + item.price).length > 7" />
          <img :src="goldImg" />
          <span>{{ (item?.price ?? 0).toLocaleString('en-US') }}</span>
        </small>
      </div>
    </div>
    <div class="list-empty" v-else>
      <div>{{ $t('目前尚無禮物') }}</div>
    </div>
    <!-- <div class="donate-event" v-if="!isMobile">
      <div v-for="i in 5" :key="i" class="donate-event-items">
        <img :src="getUrl('event.svg')" />
      </div>
    </div> -->
  </div>
</template>

<script setup>
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import { ref, onMounted, watch, computed, inject } from 'vue'
  import { getRGB, DONATE_CSS } from './donateCss.js'
  import { useStream, useChat, useDonate } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { postDonatePay } from '@/api/request.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const drawerList = inject('drawerList')
  const handleLoginRedirect = inject('handleLoginRedirect')
  const streamStore = useStream()
  const chatStore = useChat()
  const donateStore = useDonate()
  const defaultSettingStore = useDefaultSetting()
  const { donateOptionsList, isInitReady, channelData, isFinishStream } = storeToRefs(streamStore)
  const { isMobile, memberInfo } = storeToRefs(defaultSettingStore)
  const { chatSuccess } = storeToRefs(chatStore)
  const isDonateVisible = computed(() => drawerList.value.donate)

  const props = defineProps({
    closeDonateDrawer: {
      type: Function,
      default: () => {},
    },
  })

  const getUrl = filename => {
    return new URL(`/src/assets/image/donate/${filename}`, import.meta.url).href
  }
  const donateCategoryList = [{ optionCategoryId: 0, id: 'all', rgb: [], label: '全部' }, ...DONATE_CSS]

  const isDonate = computed(() => isInitReady.value && chatSuccess.value && !isFinishStream.value)
  const getImageUrl = filename => {
    return new URL(`/src/${filename}`, import.meta.url).href
  }
  const submit = async (item, index) => {
    if (!memberInfo?.value?.memberId) return handleLoginRedirect()
    if (isFinishStream.value) return new Error(t('直播已結束'))
    try {
      // 確認一次wallet連線
      if (!donateStore.walletSuccess) {
        ElMessage.warning({ message: `${t('錢包重新連線中')}......` })
        await donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
        return
      }
      // 判斷錢夠不夠
      const walletInt = parseInt(donateStore.walletPoint.replace(/,+/g, ''), 10)
      if (walletInt < item.price) throw new Error(t('餘額不足'))

      // 確認一次chat連線
      if (!chatSuccess.value) {
        ElMessage.warning({ message: `${t('聊天室重新連線中')}......` })
        await chatStore.initConnectChatSignalR()
        return
      }
      // 抖內
      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())
      const lang = locationParamsObject?.lang ?? defaultSettingStore.language

      const input = {
        optionId: item.optionId,
        currency: defaultSettingStore.memberInfo.currency,
        amount: 1,
        doneeUserId: channelData.value.userId,
        streamChannelId: channelData.value.streamChannelId,
        locale: lang,
        message: '',
      }
      const res = await postDonatePay(input)
      if (!res?.Status) throw new Error(t('抖內失敗，請稍後再試'))
      if (parseInt(res.Status.Code)) {
        if (res.Status.Code === '605') throw new Error(t('餘額不足'))
        else if (res.Status.Code === '3001') throw new Error(t('直播已結束'))
        else throw new Error(res.Status.Message)
      }
      props.closeDonateDrawer()
    } catch (e) {
      ElMessage.error({ message: e.message })
    }
  }

  // 抖內分類顯示
  const actionCategoryId = ref(0)
  watch(isDonateVisible, () => {
    actionCategoryId.value = 0
  })
</script>

<style lang="scss" scoped>
  .donate-list {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    background-color: #263045;

    .donate-event {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: auto;
      gap: 10px;
      border-top: 1px solid #3a4b70;
      padding: 10px;
      .donate-event-items {
        border-radius: 10px;
        &:first-child {
          grid-column: 1 / -1;
        }
        img {
          width: 100%;
          height: auto;
        }
      }
    }
    .sticky-top {
      color: white;
      width: 100%;
      padding: 10px 0 !important;
      background-color: var(--main-dark);
      text-align: center;
    }

    .donate-items-area {
      flex-grow: 1;
      align-content: flex-start;
      background-color: #263045;
      overflow-y: scroll;
      padding: 0;
      margin: 0;

      .donate-items {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: white;
        background-color: inherit;
        height: auto;
        padding: 15px 0;
        border: 0;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #3c4863;
        }

        .el-avatar {
          flex-shrink: 0;
          background-color: transparent;
        }
        .name {
          word-break: break-all;
          font-weight: bold;
          line-height: 1.2em;
          padding: 4px 8px;
          border-radius: 5px;
          font-size: 11px;
          margin-top: 6px;
          text-align: center;

          span {
            color: white;
          }
        }

        img {
          width: 10px;
          height: 10px;
          margin-top: -2px;
          margin-right: 2px;
        }
      }
    }

    .list-empty {
      flex-grow: 1;
      padding: 0 5px;
      overflow-y: scroll;
      scrollbar-width: none;
      color: white;

      > div {
        border-top: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 15px 0 !important;
        border-radius: 0 !important;

        &.action {
          background-color: #3a3f4a;
          :deep(.el-button) {
            background-color: var(--main-red);
          }
        }
        :deep(.el-avatar) {
          flex-shrink: 0;
        }
        .name {
          flex-grow: 1;
          text-align: center;
          word-break: break-all;
          font-weight: bold;
          font-size: 16px;
        }
        .opacity-red-btn {
          min-width: 75px;
        }
      }
    }
    .list-empty::-webkit-scrollbar {
      display: none; /* For Chrome, Safari, and Edge */
    }

    .donate-category {
      background-color: #1e2636;
      display: flex;
      justify-content: center;
      align-items: center;
      border-top: 1px solid #3a4b70;
      border-bottom: 1px solid #3a4b70;
      padding: 0 3px;
      .donate-category-item {
        flex-grow: 1;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 11px;
        color: #8094bb;
        background-color: #3c4863;
        border-radius: 50px;
        height: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 8px 3px;
        width: 100%;

        &.active,
        &:hover {
          color: white;
        }

        img {
          width: 17px;
          margin-right: 5px;
        }
      }
    }
  }
</style>
