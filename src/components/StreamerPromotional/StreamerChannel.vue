<template>
  <div v-if="refresh" class="view-streamer-channel" :style="`${route.path === '/' ? 'position: absolute; top: 0;' : ''}`">
    <div class="top-title">
      <i class="bi bi-arrow-left pe-2" @click="backFunction"></i>
      {{ $t('所有直播公告日程') }}
    </div>
    <div
      v-for="(group, groupIndex) in groupedList.sort(
        (a, b) => new Date(a[0].startTime).getTime() - new Date(b[0].startTime).getTime(),
      )"
      :key="groupIndex"
      :class="`group group-${groupIndex}`"
    >
      <div class="fw-bold">{{ titleFormat(group[0].startTime) }}</div>
      <el-card
        v-for="(item, index) in group.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())"
        :key="index"
        class="group-items"
      >
        <div class="live-title">
          <span>{{ $t('Live直播活動') }}</span>
          <span>{{ countdown[`${groupIndex}-${index}`] ? countdown[`${groupIndex}-${index}`].value : '' }}</span>
        </div>
        <div><img :src="icon_calendar" />{{ cardDateFormat(item.startTime) }}</div>
        <div><img :src="icon_time" />{{ cardTimeFormat(item.startTime, `${groupIndex}-${index}`) }}</div>
        <div><img :src="icon_game" />{{ cardgameName(item.gameId) }}</div>
      </el-card>
    </div>
    <div v-if="!groupedList.length" class="channel-empty">
      {{ $t('目前直播主尚未設定直播預定時間，請密切注意直播公告。') }}
    </div>
  </div>
</template>
<script setup>
  import icon_calendar from '@/assets/image/streamerPromotional/icon_calendar.png'
  import icon_game from '@/assets/image/streamerPromotional/icon_game.png'
  import icon_time from '@/assets/image/streamerPromotional/icon_time.png'
  import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
  import dayjs from 'dayjs'
  import duration from 'dayjs/plugin/duration'
  import localeData from 'dayjs/plugin/localeData'
  import relativeTime from 'dayjs/plugin/relativeTime'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { getGetStreamChannel } from '@/api/stream.js'
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  const defaultSettingStore = useDefaultSetting()
  const { gameList, refresh } = storeToRefs(defaultSettingStore)
  const route = useRoute()

  dayjs.extend(duration)
  dayjs.extend(localeData)
  dayjs.extend(relativeTime)

  const { t } = useI18n()

  const props = defineProps({
    userId: {
      type: Number,
    },
    backFunction: {
      type: Function,
    },
  })

  const streamChannelList = ref([])
  const init = async () => {
    try {
      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())
      const gameid = locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID
      streamChannelList.value = await getGetStreamChannel({
        GameId: gameid,
        UserId: props.userId,
        Status: 0,
      }).then(res => res.data)
    } catch (e) {
      console.warn('StreamChannel資料取得異常', e)
      streamChannelList.value = []
    }
  }
  onMounted(() => {
    init()
  })

  const countdown = reactive({
    //   index: { // 索引值
    // value: // 字串
    // timer: // setInterval
    // }
  })

  const groupedList = computed(() => {
    return Object.values(
      streamChannelList.value.reduce((acc, item) => {
        const date = item.startTime.split('T')[0]
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(item)
        return acc
      }, {}),
    )
  })

  const titleFormat = date => {
    const d = dayjs(date)
    // return d.isSame(dayjs(), 'day') ? `${d.format('MM月DD日')} (今天)` : d.format('MM月DD日')
    return d.isSame(dayjs(), 'day') ? `${d.format('MMM DD')} (${t('今天')})` : d.format('MMM DD')
  }

  const cardDateFormat = date => {
    var d = dayjs(date).day()
    // var week = ['日', '一', '二', '三', '四', '五', '六']
    var week = dayjs.weekdays()
    // return `星期${week[d]},${dayjs(date).format('MM月DD日,YYYY')}`
    return `${week[d]},${dayjs(date).format('MMM D,YYYY')}`
  }

  const updateCountdown = millisecond => {
    const duration = dayjs.duration(millisecond, 'milliseconds')
    const year = duration.years()
    const month = duration.months()
    const days = duration.days()

    if (year >= 1) {
      return `${t('倒數')} ${dayjs().subtract(year, 'y').fromNow(true)}`
    }

    if (month >= 1) {
      return `${t('倒數')} ${dayjs().subtract(month, 'M').fromNow(true)}`
    }

    if (days >= 1) {
      return `${t('倒數')} ${dayjs().subtract(days, 'd').fromNow(true)}`
    } else {
      return `${t('倒數')} ${duration.format('HH:mm:ss')}`
    }
  }

  const countdownFormat = (startTime, index) => {
    // 判斷有無對應欄位
    if (!countdown.hasOwnProperty(index)) {
      // 判斷是否需要倒數
      const now = Date.now()
      const startMillisecond = new Date(startTime).getTime()
      if (startMillisecond > now) {
        let over = startMillisecond - now

        countdown[`${index}`] = {
          value: updateCountdown(over),
          timer: null,
        }
        // 如果超出的時間小於一天
        if (over < 86400000) {
          // 設定計時器
          countdown[`${index}`].timer = setInterval(() => {
            over -= 1000
            if (over <= 0) {
              clearInterval(countdown[`${index}`].timer)
              countdown[`${index}`].value = ''
              streamChannelList.value.forEach((item, i) => {
                if (item.startTime === startTime) {
                  streamChannelList.value.splice(i, 1)
                }
              })
            } else {
              countdown[`${index}`].value = updateCountdown(over)
            }
          }, 1000)
        }
      }
    }
  }

  const cardTimeFormat = (startTime, index) => {
    const ds = dayjs(startTime)
    // const de = dayjs(endTime)
    countdownFormat(startTime, index)
    // return ds.format('A') === de.format('A')
    //   ? `${ds.format('A hh:mm')} - ${de.format('hh:mm')}`
    //   : `${ds.format('A hh:mm')} - ${de.format('A hh:mm')}`
    return ds.format('A hh:mm')
  }

  const cardgameName = gameId => {
    return gameList.value.find(e => parseInt(e.gameId) === parseInt(gameId))?.gamei18nName ?? ''
  }

  // 檢查是否倒數中並停止倒數
  // 清空物件
  onUnmounted(() => {
    for (let [key, value] of Object.entries(countdown)) {
      if (countdown[key].timer) {
        clearInterval(countdown[key].timer)
        delete countdown[key]
      }
    }
  })
</script>

<style lang="scss">
  .view-streamer-channel {
    height: 100%;
    width: 100%;
    color: black;
    overflow: scroll;
    scrollbar-width: none;
    background-color: white;

    .top-title {
      background-color: white;
      font-size: 20px;
      width: 100%;
      padding: 10px 15px;
      font-weight: bold;

      i {
        cursor: pointer;
      }
    }

    .group {
      padding: 25px 15px 15px 15px;
      font-size: 14px;

      .fw-bold {
        font-size: 17px;
      }

      .live-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--main-red);
        span:nth-child(1) {
          background-color: var(--main-red);
          color: white;
          border-radius: 5px;
          padding: 3px 14px;
          width: fit-content;
          white-space: nowrap;
        }
      }

      .group-items {
        margin: 15px 0;
        border-radius: 10px;
        background-color: white;
        .el-card__body > div {
          margin-bottom: 0.5em;
        }

        img {
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }
      }
    }

    .channel-empty {
      color: black;
      padding: 30px 15px;
      text-align: center;
    }
  }
</style>
