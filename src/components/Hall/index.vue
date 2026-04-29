<template>
  <main>
    <ViewHeader />
    <!-- 熱播中 -->
    <section id="streaming">
      <div class="tab-wrapper mb-5">
        <div class="tab flex mb-4">
          <el-image :src="hot" :style="tabStyle" />
          <span>{{ $t('熱播中') }}</span>
        </div>
        <ViewHotSwiper :allChannelList="streamStore.allChannelList" :reInit="init" />
      </div>
    </section>

    <!-- <testCarousel /> -->
    <section id="streamer" :style="`padding-bottom: ${calculateCss(80)}vw;`">
      <!-- 推薦直播主 -->
      <div class="tab-wrapper" :style="`margin-bottom: ${calculateCss(25)}vw;`">
        <div class="tab flex" style="font-size: 24px">
          <el-image :src="recommend" :style="tabStyle" />
          <span>{{ $t('推薦直播主') }}</span>
        </div>
      </div>
      <ViewRecommendationSwiper :streamerList="streamers" :reInit="init" />
    </section>

    <!-- 即將上線 -->
    <section id="commingSoon" :style="`padding-bottom: ${calculateCss(80)}vw;`">
      <!-- 推薦直播主 -->
      <div class="commingSoon" :style="`margin-bottom: ${calculateCss(25)}vw;`">
        <div class="tab flex" style="font-size: 24px">
          <el-image :src="commingSoon" :style="tabStyle" />
          <span>{{ $t('即將上線') }}</span>
        </div>
      </div>
      <ViewCommingSoon v-if="streamStore.channelCommingSoonList.length" :commingSoonList="streamStore.channelCommingSoonList" />
      <p v-else class="no-data">{{ $t('目前沒有即將上線的內容') }}</p>
    </section>
    <!-- <section> 遊戲分類 </section> -->
  </main>
</template>

<script setup>
  import defaultPhoto3 from '@/assets/image/hall/default_photo_3.svg'
  import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
  import { getStreamers } from '@/api/hall.js'
  import { getGetStreamChannel } from '@/api/stream.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useStream, useDonate } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { useRouter, useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'

  import ViewHeader from '@/components/Header/index.vue'
  import ViewHotSwiper from './Carousel/HotSwiper.vue'
  import ViewRecommendationSwiper from './Carousel/RecommendationSwiper.vue'
  import ViewCommingSoon from './Carousel/CommingSoon.vue'

  import hot from '@/assets/image/hall/Hot.png'
  import recommend from '@/assets/image/hall/Recommend.png'
  import commingSoon from '@/assets/image/hall/CommingSoon.png'
  // import catagories from '@/assets/image/hall/Categories.png'
  import { ElMessage } from 'element-plus'
  import { computeStyles } from '@popperjs/core'

  const defaultSettingStore = useDefaultSetting()
  const { screenWidth, memberInfo, isAppInitReady } = storeToRefs(defaultSettingStore)
  const { calculateCss } = defaultSettingStore
  const streamStore = useStream()
  const donateStore = useDonate()

  const { t } = useI18n()
  const streamers = ref([])
  const router = useRouter()
  const route = useRoute()

  const tabStyle = computed(() => `width: 30px;height: 30px;margin: auto 0;margin-right: ${calculateCss(10)}vw;`)

  const initInterval = ref(null)
  const initAutoUpdate = () => {
    clearInterval(initInterval.value)
    initInterval.value = setInterval(init, 3 * 60 * 1000)
  }
  onMounted(async () => {
    init()
    initAutoUpdate()
  })
  onUnmounted(() => {
    clearInterval(initInterval.value)
  })

  watch(isAppInitReady, val => {
    if (val) init()
  })

  const init = async () => {
    if (!isAppInitReady.value) return
    try {
      // 1. 取得直播列表
      const locationParams = new URLSearchParams(window.location.search)
      const locationParamsObject = Object.fromEntries(locationParams.entries())
      const gameid = locationParamsObject?.gameid ?? import.meta.env.VITE_GAME_ID
      const channelDataList = await getGetStreamChannel({ GameId: gameid, Status: 1 }).then(res => res.data)
      streamStore.setChannelListData(channelDataList)

      // 1.5 取得即將上線的直播列表
      const channelCommingSoonList = await getGetStreamChannel({ GameId: gameid, Status: 0 }).then(res => res.data)
      streamStore.setChannelCommingSoonData(channelCommingSoonList)
      // 2.取得推薦直播主
      const streamerRecommendList = await getStreamers().then(res => res.data)
      streamers.value = streamerRecommendList.map(items => {
        return {
          ...items,
          photos: items.photos?.length ? items.photos : [{ photoPath: defaultPhoto3 }],
        }
      })

      // 3. 檢查錢包連線(currency, memberId)
      if (!donateStore.connectWallet && memberInfo.value.memberId)
        donateStore.initConnectWalletSignalR(memberInfo.value.currency ?? 'TWD', memberInfo.value.memberId)
    } catch (e) {
      console.warn(e)
    }
  }
</script>

<style scoped lang="scss">
  main {
    section {
      position: relative;
      .no-data {
        color: white;
        text-align: center;
      }
      .tab-wrapper {
        width: 100vw;
        .tab {
          width: fit-content;
          margin: 0 auto;
          font-size: 24px;
          span {
            color: #ff2d55;
            font-weight: 700;
            cursor: default;
          }
        }
      }

      .arrow-mobile {
        width: 100vw;
        position: absolute;
        justify-content: space-between;
        align-items: center;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      .commingSoon {
        .tab {
          justify-content: center;
          color: #ff2d55;
          font-weight: 700;
          cursor: default;
          i {
            color: #1f2530;
            background-color: #ff2d55;
            border-radius: 50%;
          }
        }
      }
    }
    .flex {
      display: flex;
    }
  }
  #dynamicCards {
    .el-carousel__item--card {
      width: fit-content;
      height: fit-content;
      color: white;
      background: black;
    }
  }

  /* we will explain what these classes do next! */
  .v-enter-active,
  .v-leave-active {
    transition: opacity 0.5s ease;
  }

  .v-enter-from,
  .v-leave-to {
    opacity: 0;
  }

  // .testCard{
  //     width: 340px;
  //     height: 340px;
  //     color: white;
  //     background: black;
  //     margin: 0 auto;
  // }
</style>
