<template>
  <div class="home-swiper container">
    <Swiper
      :effect="'coverflow'"
      :grabCursor="true"
      :centeredSlides="true"
      :slidesPerView="'auto'"
      :coverflowEffect="{
        rotate: 0,
        stretch: 70,
        scale: 0.9,
        depth: 0,
        modifier: 1,
        slideShadows: true,
      }"
      :initialSlide="Math.floor((streamChannel.length - 1) / 2)"
      :loop="Boolean(streamChannel.length > 3)"
      :slideToClickedSlide="true"
      :bulletActiveClass="'bulletActiveClass'"
      :bulletClass="'bulletClass'"
      :modules="[EffectCoverflow, Pagination, Navigation, Autoplay]"
      class="hot-swiper"
      :navigation="{
        nextEl: nextEl,
        prevEl: prevEl,
      }"
      :pagination="{
        el: '.swiper-pagination.hot',
        clickable: true,
      }"
      :autoplay="{
        delay: 6000,
        disableOnInteraction: false,
      }"
      @slideChange="slideChange"
    >
      <SwiperSlide
        class="coverflow-slide"
        v-for="(item, forIndex) in streamChannel"
        :key="forIndex"
        :lazy="true"
        :class="{ active: isActive(forIndex, realIndex) }"
        @click="action(item)"
      >
        <div class="channel-body">
          <el-avatar class="bg" :src="item?.photoPath" :fit="'cover'" shape="square" :loading="'lazy'">
            <img :src="userPhoto" />
          </el-avatar>
          <div class="icon-live">
            <i class="bi bi-camera-video-fill"></i>
            <span>LIVE</span>
          </div>
          <div class="info-live">
            <div class="name">{{ item.roomName }}</div>
            <div class="account">{{ item.name }}</div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
    <!-- 左右箭頭 -->
    <div v-if="streamChannel.length > 1 && !isStreamerPromotionalVisible" class="swiper-button">
      <div ref="prevEl" class="swiper-button-prev"><i class="bi bi-caret-left-fill"></i></div>
      <div ref="nextEl" class="swiper-button-next"><i class="bi bi-caret-right-fill"></i></div>
    </div>
    <!-- pagination -->
    <div class="swiper-pagination hot" v-if="streamChannel.length <= 10"></div>

    <div v-if="!streamChannel.length" class="no-data">
      {{ $t('目前沒有直播') }}
    </div>
  </div>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, onMounted, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useStream } from '@/store/live.js'
  import { useI18n } from 'vue-i18n'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  // Swiper
  import { Swiper, SwiperSlide } from 'swiper/vue'
  import { EffectCoverflow, Pagination, Navigation, Autoplay } from 'swiper/modules'
  import 'swiper/css'
  import 'swiper/css/navigation'
  import 'swiper/css/pagination'

  const { t } = useI18n()
  const router = useRouter()
  const defaultSettingStore = useDefaultSetting()
  const streamStore = useStream()
  const { isMobile } = storeToRefs(defaultSettingStore)
  const { isStreamerPromotionalVisible } = storeToRefs(streamStore)
  const streamChannel = computed(() => props.allChannelList)
  const props = defineProps({
    allChannelList: {
      type: Array,
      default: () => [],
    },
    reInit: { type: Function },
  })
  const nextEl = ref(null)
  const prevEl = ref(null)

  const action = async slideItem => {
    // 先記錄頻道資料
    streamStore.setChannelData(slideItem)
    // 再取一次直播頻道
    const result = await streamStore.checkIfStreamEnded(slideItem.gameId, slideItem.userId, slideItem.streamChannelId)
    // 移動到直播頁面
    if (result)
      router.push(
        `/live${window.location.search ? window.location.search + '&' : '?'}streamchannelid=${result.streamChannelId}&streamerid=${result.userId}`,
      )
    // 更新熱播中和推薦直播主
    else props.reInit()
  }
  const activeIndex = ref(0)
  const realIndex = ref(0)

  const images = Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    url: `https://picsum.photos/seed/${Math.random()}/800/600`,
  }))

  const slideChange = swiper => {
    activeIndex.value = swiper.activeIndex
    realIndex.value = swiper.realIndex
  }
  const isActive = (forIndex, realIndex) => {
    return Boolean(Math.abs(realIndex - forIndex) <= 2 || Math.abs(realIndex - forIndex) >= streamChannel.value.length - 2)
  }
</script>

<style lang="scss" scoped>
  .home-swiper {
    --swiper-item-width: min(38vw, 240px);
    .swiper-button {
      display: flex;
      justify-content: space-between;
      position: relative;
      width: 100%;
      top: 0px;
      height: var(--swiper-item-width);
      margin-top: calc(var(--swiper-item-width) * -1);
      .swiper-button-prev,
      .swiper-button-next {
        position: relative;
        color: white;
        border-radius: 30px;

        &::after {
          content: '';
        }
        i {
          font-size: 45px;
          line-height: 45px;
        }
      }
    }
    :deep(.swiper-pagination) {
      position: relative;
      width: 100%;
      text-align: center;
      padding: 10px 0;
      .swiper-pagination-bullet {
        background: #3a4359;
        opacity: 1;
        &.swiper-pagination-bullet-active {
          background: #f12889;
        }
      }
    }
    .hot-swiper {
      margin: 0 50px;
      .coverflow-slide {
        width: calc(100% / 5);
        max-width: var(--swiper-item-width);
        opacity: 0;
        pointer-events: none;

        &.active {
          opacity: 1;
          pointer-events: auto;
        }
      }
      .swiper-slide {
        background-color: #1f2530;
        width: var(--swiper-item-width) !important;
        height: var(--swiper-item-width) !important;
        overflow: hidden;
        border-radius: 15px;
        .channel-body {
          width: var(--swiper-item-width);
          height: var(--swiper-item-width);
          cursor: pointer;
          filter: blur(10px);
          .bg {
            width: 100%;
            height: 100%;
          }

          .icon-live {
            background: linear-gradient(to right, #f78361, #f54b64);
            position: absolute;
            top: 5px;
            left: 5px;
            font-size: 12px;
            color: white;
            border-radius: 30px;
            padding: 2px 7px;
            span {
              color: white;
              padding-left: 3px;
            }
          }
          .info-live {
            color: rgb(255, 45, 85);
            position: absolute;
            bottom: 10px;
            left: 8px;
            text-shadow: 0 0 2px #00000059;
            .name {
              font-size: 15px;
            }
            .account {
              font-size: 12px;
            }
          }
        }

        &.swiper-slide-prev,
        &.swiper-slide-next {
          .channel-body {
            filter: blur(2px);
          }
        }
        &.swiper-slide-active .channel-body {
          filter: blur(0);
        }
      }
    }
    .no-data {
      color: white;
      text-align: center;
    }

    @media (max-width: 991px) {
      .hot-swiper {
        .coverflow-slide {
          width: calc(100% / 5);
          max-width: var(--swiper-item-width);
          opacity: 0;
          pointer-events: none;

          &.active {
            opacity: 0;
            pointer-events: none;
            &.swiper-slide-prev,
            &.swiper-slide-next,
            &.swiper-slide-active {
              opacity: 1;
              pointer-events: auto;
            }
          }
        }
      }
    }
  }
  @media (max-width: 767px) {
    .home-swiper {
      padding: 0;
      max-width: 100%;
      width: 100%;
      margin-right: 0;
      margin-left: 0;
      .hot-swiper {
        margin: 0;
      }
      .swiper-button {
        .swiper-button-prev,
        .swiper-button-next {
          i {
            font-size: 25px;
            line-height: 25px;
          }
        }
      }
    }
  }
</style>
