<template>
  <div class="view-recommendations-swiper container-xxl">
    <Swiper
      :key="viewCount"
      :slidesPerView="streamrSwiperList.length >= viewCount ? viewCount : 'auto'"
      :grabCursor="true"
      :centeredSlides="false"
      :loop="Boolean(streamrSwiperList.length > viewCount)"
      :spaceBetween="0"
      :initialSlide="2"
      :modules="[Navigation]"
      class="recommendations-swiper"
      :class="{ 'justify-center': streamrSwiperList.length < viewCount }"
      :navigation="{
        nextEl: nextEl,
        prevEl: prevEl,
      }"
    >
      <SwiperSlide v-for="(item, forIndex) in streamrSwiperList" :key="forIndex" :lazy="true">
        <div class="custom-card" :class="{ isLiving: item.isLiving }">
          <div class="custom-card-header d-flex">
            <div class="avatar" @click="toLive(item)">
              <el-avatar :src="item?.photoPath" fit="cover">
                <img :src="userPhoto" />
              </el-avatar>
              <div class="icon-live">
                <i class="bi bi-camera-video-fill"></i>
                <span>LIVE</span>
              </div>
            </div>
            <div class="custom-info">
              <div class="name">{{ item.name }}</div>
              <div class="account">@{{ item.account }}</div>
            </div>
            <el-button round @click="toLive(item)">{{ item.isLiving ? $t('看直播') : $t('宣傳頁') }}</el-button>
          </div>
          <div class="custom-card-body">
            <div
              class="img-square"
              :class="{ only: item.photos.length === 1 }"
              v-for="(img, imgIndex) in item.photos.slice(0, 2)"
              :key="imgIndex"
              @click="getPromotional(item)"
            >
              <img :src="img.photoPath" :loading="'lazy'" />
            </div>
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
    <!-- 左右箭頭-->
    <div :class="`swiper-button viewCount${viewCount}`" v-if="streamrSwiperList.length >= viewCount">
      <div ref="prevEl" class="swiper-button-prev"><i class="bi bi-caret-left-fill"></i></div>
      <div ref="nextEl" class="swiper-button-next"><i class="bi bi-caret-right-fill"></i></div>
    </div>

    <div v-if="!streamrSwiperList.length" class="no-data">
      {{ $t('無推薦直播主') }}
    </div>
  </div>
</template>
<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, onMounted, computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useRoute, useRouter } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { Swiper, SwiperSlide } from 'swiper/vue'
  import { Navigation, Pagination } from 'swiper/modules'
  import 'swiper/css'
  import 'swiper/css/navigation'
  import 'swiper/css/pagination'

  const router = useRouter()
  const route = useRoute()
  const defaultSettingStore = useDefaultSetting()
  const { isMobile, screenWidth } = storeToRefs(defaultSettingStore)
  const props = defineProps({
    streamerList: {
      type: Array,
      default: () => [],
    },
    reInit: { type: Function },
  })
  const nextEl = ref(null)
  const prevEl = ref(null)
  // 一行出現的數量
  const viewCount = computed(() => {
    return screenWidth.value > 1200 ? 4 : isMobile.value ? 1 : screenWidth.value > 850 ? 3 : 2
  })
  // swiper版本10需要讓輪播長度>顯示數量*2才能不出問題的loop
  // 視狀況複製長度使輪播加長
  const streamrSwiperList = computed(() => {
    // 填補預設photo
    const list = props.streamerList
    if (list.length <= viewCount.value * 2 && list.length >= viewCount.value) {
      const result = []
      while (result.length < viewCount.value * 2) {
        result.push(...list)
      }
      return result
    } else return list
  })

  // 開啟宣傳頁
  const getPromotional = async streamer => {
    router.push(`/StreamerPromotional/${streamer.userId}${window.location.search}`)
  }
  const toLive = async streamer => {
    if (streamer.isLiving) {
      // 跳轉至直播頁
      const query = route.query
      const result = await checkIfStreamEnded(query.gameid, streamer.userId, streamer.streamChannelId)
      if (result) {
        router.push(
          `/live${window.location.search ? window.location.search + '&' : '?'}streamchannelid=${result.streamChannelId}&streamerid=${streamer.userId}`,
        )
      } else props.reInit()
    } else {
      getPromotional(streamer)
    }
  }
</script>

<style lang="scss" scoped>
  .view-recommendations-swiper {
    :deep(.recommendations-swiper) {
      margin: 0 50px;
      &.justify-center .swiper-wrapper {
        justify-content: center;
      }
      .swiper-slide {
        background-color: #1f2530;
        width: 300px;
        height: auto;
        overflow: hidden;
        padding: 10px;

        .custom-card {
          box-shadow: 0 0 15px rgba(0, 0, 0, 0.5215686275);
          padding: 10px;
          border-radius: 10px;
          height: 100%;

          .custom-card-header {
            padding: 5px 0;
            align-items: center;
            .avatar {
              flex-shrink: 0;
              width: 20%;
              height: auto;
              .icon-live {
                background: linear-gradient(to right, #f78361, #f54b64);
                font-size: 10px;
                color: white;
                border-radius: 30px;
                padding: 2px 7px;
                text-align: center;
                margin: -15px auto 0 auto;
                position: relative;
                z-index: 1;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                max-width: 60px;
                opacity: 0;
                span {
                  color: white;
                  padding-left: 3px;
                }
              }
              .el-avatar {
                width: 100%;
                height: 100%;
              }
            }
            .custom-info {
              color: white;
              flex-grow: 1;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              font-size: 14px;
              padding-left: 10px;
              > div {
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
              .account {
                font-size: 10px;
              }
            }
            .el-button {
              background: linear-gradient(to right, #306aff, #f12889);
              border: none;
              color: #ffffff;
              padding: 0px 12px;
              font-size: 12px;
              height: 28px;
            }
          }
          .custom-card-body {
            display: flex;
            .img-square {
              width: 50%;
              padding-bottom: 50%; /* 高度等於寬度 */
              position: relative;
              overflow: hidden;
              margin-left: 4px;
              margin-right: 0;
              cursor: pointer;
              &:first-child {
                margin-left: 0;
                margin-right: 4px;
              }
              img {
                border-radius: 10px;
                width: 50%;
                display: block;
                height: 50%;
                position: absolute;
                top: 0;
                left: auto;
                right: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              &.only {
                margin: 0;
                width: 100%;
              }
            }
          }
          &.isLiving {
            .el-avatar {
              border: 2px solid red;
            }
            .icon-live {
              opacity: 1 !important;
            }
          }
        }
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
    --max-height: min(20vw, 280px);
    .swiper-button {
      display: flex;
      justify-content: space-between;
      position: relative;
      width: 100%;
      top: 0px;
      height: 26vw;
      margin-top: -26vw;

      &.viewCount1 {
        height: 65vw;
        margin-top: -65vw;
      }
      &.viewCount2 {
        height: 36vw;
        margin-top: -36vw;
      }
      &.viewCount3 {
        height: 26vw;
        margin-top: -26vw;
      }
      &.viewCount4 {
        height: var(--max-height);
        margin-top: calc(var(--max-height) * -1);
      }
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
    @media (max-width: 767px) {
      :deep(.recommendations-swiper) {
        margin: 0 30px;
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

    .no-data {
      color: white;
      text-align: center;
    }
  }
</style>
