<template>
  <div class="view-user-betlog" v-loading="isLoading">
    <div class="flex-table betlog-scroll" id="betlog-scroll" :key="betlogList.length">
      <div class="flex-title">
        <div class="betTime">{{ $t('日期') }}</div>
        <div class="payout">{{ $t('單號') }}</div>
        <div class="streamerName">{{ $t('直播主') }}</div>
        <div class="roomName">{{ $t('直播房間') }}</div>
        <div class="bet">{{ $t('投入金額') }}</div>
        <div class="odds">{{ $t('高度') }}</div>
        <div class="payout">{{ $t('獲獎金額') }}</div>
      </div>
      <div class="flex-content" v-for="(item, index) in betlogList" :key="index">
        <div class="betTime">{{ dayjs(item.betTime).format('YYYY-MM-DD') }}<br />{{ dayjs(item.betTime).format('HH:mm') }}</div>
        <div class="odds">{{ item.betId }}</div>
        <div class="streamerName">{{ item.streamerName }}</div>
        <div class="roomName">{{ item.roomName }}</div>
        <div class="bet"><img :src="goldImg" />{{ item.bet.toLocaleString('en-US') }}</div>
        <div class="odds">x{{ item.odds }}</div>
        <div class="payout"><img :src="goldImg" />{{ item.payout.toLocaleString('en-US') }}</div>
      </div>
      <div v-if="!betlogList.length" class="no-data">
        <img :src="noDataImage" />
        <div>{{ $t('目前還沒有遊玩紀錄') }}</div>
      </div>
    </div>

    <div class="betlog-pagination" v-if="betlogList.length">
      <el-pagination layout="prev, pager, next" :total="totalCount" :page-size="pageSize" @change="handleSizeChange" />
    </div>
  </div>
</template>

<script setup>
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import noDataImage from '@/assets/image/betlog/no-data.svg'
  import { ref, computed, onMounted, watch } from 'vue'
  import { getGameBetlog } from '@/api/stream.js'
  import { ElMessage, imageEmits } from 'element-plus'
  import dayjs from 'dayjs'
  import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()

  // 取得遊玩紀錄
  const isLoading = ref(false)
  const betlogList = ref([])
  const activePage = ref(1)
  const pageSize = 20
  const totalCount = ref(1)
  const actionGetGameBetlog = async (page = 1) => {
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    const gameid = locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID
    try {
      isLoading.value = true
      const input = {
        gameid: gameid,
        lang: locale.value,
        page: page,
        pageSize: pageSize,
      }
      const res = await getGameBetlog(input)
      betlogList.value = res.data
      totalCount.value = res?.totalCount ?? 1
      isLoading.value = false
    } catch (e) {
      betlogList.value = []
      tableData.value = []
      totalCount.value = 1
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
    if (activePage >= totalCount.value) return
    activePage.value++
    actionGetGameBetlog(activePage.value)
  }
  const handleSizeChange = page => {
    activePage.value = page
    actionGetGameBetlog(activePage.value)
  }
  onMounted(() => {
    activePage.value = 1
    actionGetGameBetlog(activePage.value)
  })
</script>
<style lang="scss" scoped>
  .view-user-betlog {
    min-height: 100%;
    padding-bottom: 100px;
    .sub-title {
      background-color: #1e2636;
      height: 50px;
      button {
        position: absolute;
        background-color: transparent;
        color: white;
        padding: 0 15px;
        height: 50px;
        font-size: 20px;
      }
      .title {
        line-height: 50px;
        text-align: center;
      }
    }
    .flex-table {
      min-height: 100%;
      padding: 15px;
      font-size: 12px;
      background-color: #242b37;
      border-radius: 10px;
      margin-bottom: 30px;
      overflow: scroll;
      scrollbar-width: none;
      .flex-title,
      .flex-content {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        align-items: start;
        text-align: center;
        word-break: break-all;
        > div {
          word-break: break-all;
        }
      }
      .flex-title {
        margin-bottom: 15px;
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
        margin-bottom: 10px;
        align-items: center;
        > div {
          padding: 5px 3px;
        }

        .payout {
          color: #ffbd20;
        }
        .betTime {
          text-align: left;
          padding-left: 15px;
        }
        .bet,
        .payout {
          img {
            width: 10px;
            margin-top: -2px;
            margin-right: 3px;
          }
        }

        &:last-child {
          margin-bottom: 0px;
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
        padding: 20% 0;
      }
      .flex-title,
      .flex-content,
      .no-data {
        width: 100%;
        min-width: 610px;
      }
    }

    :deep(.el-loading-mask) {
      background-color: #000000a1;
      .el-loading-spinner .path {
        stroke: white;
      }
    }

    .betlog-pagination {
      :deep(.el-pagination) {
        justify-content: center;
        button {
          background-color: transparent;
          color: white;
        }
        ul {
          li {
            background-color: transparent;
            color: white;

            &.is-active {
              color: #83abfa;
            }
          }
        }
      }
    }
  }
</style>
