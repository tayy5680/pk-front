<template>
  <div class="view-comming-soon">
    <Carousel :itemsToShow="itemToShow" v-bind="config" :mouseDrag="soonList.length > 1">
      <Slide v-for="(item, index) in soonList" :key="index">
        <div class="carousel__item">
          <div class="top">
            {{
              dayjs(item.startTime)
                .local()
                .format(COMMING_SOON_FORMAT?.[language]?.format ?? 'dddd, MMMM D, YYYY')
            }}
          </div>
          <div class="dot"></div>
          <div class="time">{{ dayjs(item.startTime).local().format('A hh:mm') }}</div>
          <div class="item-card">
            <div class="item-card-image" :style="`background-image:url(${item.photoPath})`"></div>
            <div class="hover-show">
              <el-avatar class="me-2" :size="30" :src="item.photoPath" :fit="'cover'">
                <img :src="userPhoto" />
              </el-avatar>
              <div>{{ item.name }}</div>
            </div>
            <div class="countdown">{{ item.countdown ? $t('倒數') + item.countdown : $t('即將開始') }}</div>
          </div>
        </div>
      </Slide>
    </Carousel>
  </div>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { Carousel, Slide } from 'vue3-carousel'
  import 'vue3-carousel/dist/carousel.css'
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { COMMING_SOON_FORMAT } from '@/i18n/locales.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import dayjs from 'dayjs'
  import utc from 'dayjs/plugin/utc'
  dayjs.extend(utc)
  const defaultSettingStore = useDefaultSetting()
  const { screenWidth, language } = storeToRefs(defaultSettingStore)
  const soonList = ref([])

  const props = defineProps({
    commingSoonList: {
      type: Array,
      default: () => [],
    },
  })
  const config = {
    height: 200,
    wrapAround: false,
    snapAlign: 'start',
    breakpointMode: 'carousel',
  }

  const itemToShow = computed(() => {
    const num = Math.floor(screenWidth.value / 230)
    const showNum = num > 4 ? 4 : num <= 1 ? 1 : num
    const nowNum = soonList.value.length
    return nowNum <= showNum ? nowNum : showNum
  })

  const getRemainingTime = startTime => {
    const duration = dayjs(startTime).diff(dayjs(), 'seconds')
    if (duration <= 0) return ''

    const hours = String(Math.floor(duration / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((duration % 3600) / 60)).padStart(2, '0')
    const seconds = String(duration % 60).padStart(2, '0')

    return `${hours}:${minutes}:${seconds}`
  }
  const interval = ref(null)
  const init = () => {
    soonList.value = props.commingSoonList
    if (interval.value) clearInterval(interval.value)
    interval.value = setInterval(() => {
      if (props.commingSoonList.length) {
        soonList.value = soonList.value.map(x => {
          return {
            ...x,
            countdown: getRemainingTime(x.startTime),
          }
        })
      }
    }, 1000)
  }
  onMounted(() => {
    init()
  })
  onUnmounted(() => {
    clearInterval(interval.value)
  })
</script>

<style lang="scss" scoped>
  .view-comming-soon {
    max-width: 1300px;
    width: 100%;
    margin: 0 auto;
    padding-bottom: 120px;

    .carousel__item {
      cursor: default;
      .top {
        color: var(--main-red);
        padding: 15px 0;
      }
      .dot {
        height: 1px;
        display: block;
        background: #405277;
        position: relative;
        margin: 0 -35%;

        &::after {
          content: '';
          background-color: var(--main-red);
          width: 15px;
          height: 15px;
          border-radius: 50%;
          margin-top: -7px;
          margin-left: -7.5px;
          position: absolute;
        }
      }
      .time {
        color: #8094bb;
        padding: 15px 0;
      }
      .item-card {
        border-radius: 10px;
        overflow: hidden;
        margin: 0 20px;
        color: whitesmoke;
        width: 230px;
        background-color: #121927;
        box-shadow: 0 0 11px 0px rgb(0 0 0 / 62%);

        .item-card-image {
          height: 250px;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;

          &::after {
            content: '';
            width: 100%;
            height: 250px;
            display: block;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.8) 100%);
            opacity: 0;
            transition: all 0.2s ease;
          }
        }

        &:hover {
          .item-card-image::after {
            opacity: 1;
          }
          .hover-show {
            margin-top: -50px;
          }
        }

        .hover-show {
          transition: all 0.2s ease;
          display: flex;
          padding: 10px 15px;
          align-items: center;
          position: absolute;
          margin-top: 0px;

          > span {
            flex-shrink: 0;
          }
          > div {
            flex-grow: 1;
            max-width: 160px;
            text-align: left;
            white-space: nowrap;
            overflow-x: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .countdown {
        color: var(--main-red);
        padding: 40px 10px;
        position: relative;
        background-color: #121926;
      }
    }
  }
</style>
