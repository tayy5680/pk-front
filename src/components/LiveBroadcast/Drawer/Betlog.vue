<template>
  <div class="view-sub-menu-betlog" v-loading="isLoading">
    <div class="main-title">
      <button @click="close" class="back"><i class="bi bi-chevron-left"></i></button>
      <div>{{ $t('遊玩紀錄') }}</div>
    </div>
    <div class="flex-table betlog-scroll" id="betlog-scroll" :key="betlogList.length">
      <div class="flex-title">
        <div class="odds">{{ $t('場次時間') }}</div>
        <div class="bet">{{ $t('投入金額') }}</div>
        <div class="odds">{{ $t('高度') }}</div>
        <div class="payout">{{ $t('獲獎金額') }}</div>
        <div class="payout">{{ $t('單號') }}</div>
      </div>
      <div class="flex-content" v-for="(item, index) in betlogList" :key="index">
        <div class="betTime">{{ dayjs.utc(item.betTime).local().format('HH:mm:ss') }}</div>
        <div class="bet"><img :src="goldImg" />{{ item.bet.toLocaleString('en-US') }}</div>
        <div class="odds">x{{ item.odds }}</div>
        <div class="payout"><img :src="goldImg" />{{ item.payout.toLocaleString('en-US') }}</div>
        <div class="odds">{{ item.betId }}</div>
      </div>
      <div v-if="totalCount > activePage * pageSize" class="more" @click="more">{{ $t('查看更多') }}</div>
      <div v-if="!betlogList.length" class="no-data">
        <img :src="noDataImage" />
        <div>{{ $t('目前還沒有遊玩紀錄，趕緊出發！') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import noDataImage from '@/assets/image/betlog/no-data.svg'
  import { ref, computed, onMounted, watch } from 'vue'
  import { getGameBetlogStreamChannelId } from '@/api/stream.js'
  import { ElMessage, imageEmits } from 'element-plus'
  import { useStream } from '@/store/live.js'
  import { useI18n } from 'vue-i18n'
  import dayjs from 'dayjs'
  import utc from 'dayjs/plugin/utc'
  const { t, locale } = useI18n()
  dayjs.extend(utc)

  const props = defineProps({
    close: {
      type: Function,
    },
  })

  const streamStore = useStream()
  // 取得遊玩紀錄
  const isLoading = ref(false)
  const betlogList = ref([])
  const activePage = ref(1)
  const pageSize = 20
  const totalCount = ref(1)
  const actionGetGameBetlogStreamChannelId = async (page = 1) => {
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    const gameid = locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID
    try {
      isLoading.value = true
      const input = {
        streamChannelId: streamStore.channelData.streamChannelId,
        gameid: gameid,
        lang: locale.value,
        page: page,
        pageSize: pageSize,
      }
      const res = await getGameBetlogStreamChannelId(input)

      betlogList.value = [...betlogList.value, ...res.data]
      totalCount.value = res?.totalCount ?? 0
      isLoading.value = false
    } catch (e) {
      betlogList.value = []
      tableData.value = []
      totalCount.value = 0
      activePage.value = 1
      isLoading.value = false
      ElMessage({
        showClose: true,
        message: t('遊玩紀錄取得失敗，請稍後再試'),
        type: 'error',
      })
    }
  }

  const more = () => {
    if (activePage.value * pageSize >= totalCount.value) return
    activePage.value++
    actionGetGameBetlogStreamChannelId(activePage.value)
  }
  onMounted(() => {
    activePage.value = 1
    actionGetGameBetlogStreamChannelId(activePage.value)
  })
</script>
<style lang="scss" scoped>
  .view-sub-menu-betlog {
    min-height: 100%;
    background-color: #263046;
    display: flex;
    flex-direction: column;

    .flex-table {
      min-height: 100%;
      padding: 10px 15px 30px 15px;
      padding-top: calc(var(--main-title-height) + 10px);
      font-size: 12px;
      overflow: scroll;
      flex-grow: 1;
      scrollbar-width: none;

      .flex-title,
      .flex-content {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        align-items: start;
        text-align: center;
        > div {
          word-break: break-all;
        }

        .bet,
        .payout {
          img {
            width: 10px;
            height: 10px;
            margin-top: -3px;
            margin-right: 3px;
          }
        }
      }
      .flex-title {
        margin-bottom: 6px;
        > div {
          padding: 5px 3px;
          background-color: #3a4356;
          color: white;
          border-radius: 5px;
          height: 100%;
        }
      }
      .flex-content {
        background-color: #1a1f2a;
        border-radius: 5px;
        margin-bottom: 6px;
        align-items: center;
        > div {
          padding: 5px 3px;
        }
        &:nth-child(even) {
          background-color: #42516e;
        }

        .payout {
          color: #ffbd20;
        }
      }
      .more {
        background-color: #767e8c;
        border-radius: 5px;
        padding: 5px 3px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s ease;
        &:hover {
          background-color: #8691a4;
        }
      }
      .no-data {
        display: flex;
        color: #8094bb;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding-top: 20%;
      }

      .flex-title,
      .flex-content,
      .no-data {
        width: 100%;
        min-width: 310px;
      }
    }

    :deep(.el-loading-mask) {
      background-color: #000000a1;
      .el-loading-spinner .path {
        stroke: white;
      }
    }
  }
</style>
