<template>
  <div
    class="view-streamer-promotional"
    :style="`${route.path.length === 1 ? 'position: absolute; top: 0; background-color: #F9F9F9;' : ''}`"
  >
    <div class="promotional-main" v-if="!isLoading">
      <div
        class="intro"
        :style="`background-image:url(${streamerInfo?.backGroundPhotoPath ?? userPhoto}); ${route.path.length === 1 ? 'border-radius: 0; margin-bottom: 0;' : ''}`"
      >
        <div>
          <div class="avatar">
            <el-avatar class="me-3" :size="50" :src="streamerInfo?.photoPath" key="photoPathphotoPath">
              <img :src="userPhoto" />
            </el-avatar>
            <div class="flex-grow-1">
              {{ streamerPromotional?.memberName ?? '' }}
              <br />
              <span class="id">{{ `@${streamerInfo?.account}` }}</span>
            </div>
          </div>
          <div class="end-btn">
            <!-- <el-button
              round
              class="opacity-red-btn mb-1"
              :class="{ hover: !streamerPromotional?.isFollowed }"
              @click="actionFollow(!streamerPromotional?.isFollowed)"
            >
              {{ streamerPromotional?.isFollowed ? $t('追蹤中') : $t('追蹤') }}
            </el-button> -->
            <el-button round class="opacity-red-btn m-0" @click="actionStreamerChannel">{{ $t('直播主公告') }}</el-button>
          </div>
        </div>
      </div>

      <div class="intro-other" :style="`${route.path.length === 1 ? 'border-radius: 0;' : ''}`">
        <div
          class="intro-content"
          v-if="streamerPromotional?.photos"
          :class="`${pathValid(streamerPromotional.photos.length ? streamerPromotional.photos[activeIndex].photoPath : '')}`"
          :style="`background-image: url(${photoLoaded && streamerPromotional?.photos?.[activeIndex] ? streamerPromotional.photos[activeIndex].photoPath : defaultPhoto3});`"
          @click="hideUI = !hideUI"
        >
          <div class="icons" :class="visibilityTransition" v-if="!streamerPromotional?.photos[getActiveIndex]?.isDefaultPhoto">
            <!-- 社群連結 -->
            <div class="social-media" v-if="Object.entries(streamerPromotional?.socialMediaLink).length">
              <div
                class="icon"
                v-if="streamerPromotional?.photos?.length && photoLoaded"
                @click.stop="streamStore.setPreviewImgVisible(true, activeIndex)"
              >
                <i class="bi bi-arrows-angle-expand" :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"></i>
              </div>
              <div
                class="icon"
                v-if="streamerPromotional?.socialMediaLink?.facebook"
                @click.stop="actionSocial(streamerPromotional.socialMediaLink.facebook)"
              >
                <i class="bi bi-facebook" :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"></i>
              </div>
              <div
                class="icon"
                v-if="streamerPromotional?.socialMediaLink?.instagram"
                @click.stop="actionSocial(streamerPromotional.socialMediaLink.instagram)"
              >
                <i class="bi bi-instagram" :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"></i>
              </div>
              <div
                class="icon"
                v-if="streamerPromotional?.socialMediaLink?.x"
                @click.stop="actionSocial(streamerPromotional.socialMediaLink.x)"
              >
                <i class="bi bi-twitter-x" :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"></i>
              </div>
            </div>

            <div v-if="streamerPromotional?.photos?.length && photoLoaded" class="like" :class="visibilityTransition">
              <div class="heart" v-if="photoLoaded">
                <i
                  v-if="streamerPromotional?.photos[getActiveIndex]?.isLiked"
                  class="heart bi bi-heart-fill"
                  :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"
                  @click.stop="toggleLike"
                ></i>
                <i
                  v-else
                  class="heart bi bi-heart"
                  :style="`cursor: ${hideUI ? 'unset' : 'pointer'}`"
                  @click.stop="toggleLike"
                ></i>
                <div class="text-center">{{ streamerPromotional?.photos[getActiveIndex]?.likes ?? 0 }}</div>
              </div>
            </div>
          </div>

          <div
            v-if="streamerPromotional?.photos?.length"
            class="photo d-flex"
            :class="visibilityTransition"
            @click.stop="
              () => {
                if (hideUI) hideUI = !hideUI
              }
            "
          >
            <i
              class="bi bi-chevron-left custom-arrow"
              :style="`margin-left: ${calculateCss(20)}vw; margin-right: ${calculateCss(30)}vw; cursor: ${hideUI ? 'unset' : 'pointer'}`"
              @click.stop="arrowClick('left')"
            ></i>
            <Carousel
              class="photo-carousel"
              :style="`width: ${48 * 3 + 8 * 6}px;`"
              :itemsToShow="3"
              :wrapAround="false"
              :snapAlign="'start'"
              :transition="500"
              ref="photoCarouselRef"
            >
              <Slide v-for="(slide, index) in streamerPromotional?.photos" :key="index">
                <div
                  class="slide-item"
                  :style="`${activeIndex === index ? 'border: 2px solid #0000; background: linear-gradient(135deg, #C13C6B, #761DB1) border-box; background-clip: border-area' : ''};`"
                  @click.stop="slideToIndex(index)"
                >
                  <el-image :src="slide.photoPath" fit="cover">
                    <template #error>
                      <div class="image-slot mt-1">
                        <el-icon size="36"><icon-picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
              </Slide>
            </Carousel>
            <i
              class="bi bi-chevron-right custom-arrow"
              :style="`margin-left: ${calculateCss(20)}vw; margin-right: ${calculateCss(30)}vw; cursor: ${hideUI ? 'unset' : 'pointer'}`"
              @click.stop="arrowClick('right')"
            ></i>
          </div>
        </div>
      </div>
    </div>
    <div class="intro loading" v-else>
      <div class="spinner-border" role="status"></div>
    </div>
  </div>
</template>

<script setup>
  import defaultPhoto3 from '@/assets/image/hall/default_photo_3.svg'
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { Carousel, Pagination, Slide, Navigation } from 'vue3-carousel'
  import 'vue3-carousel/dist/carousel.css'
  import { Picture as IconPicture } from '@element-plus/icons-vue'
  import { ref, onMounted, computed, watch, onUnmounted, nextTick, inject } from 'vue'
  import { ElMessage, ElMessageBox, useTransitionFallthroughEmits } from 'element-plus'
  import { getStreamerPromotional, postLikeStreamerPromotionalPhoto, postFollowStreamer, getStreamerInfo } from '@/api/stream.js'
  import { useStream } from '@/store/live.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const route = useRoute()
  const defaultSettingStore = useDefaultSetting()
  const streamStore = useStream()
  const { calculateCss } = defaultSettingStore
  const { streamerPromotional, isInitReady } = storeToRefs(streamStore)
  const { memberInfo } = storeToRefs(defaultSettingStore)
  const streamerInfo = ref({})
  const isLoading = ref(false)
  const activeIndex = ref(0)
  const livePageStreamerInfo = inject('streamerInfo', null)

  const props = defineProps({
    userId: {
      type: Number,
    },
    openStreamerChannel: {
      type: Function,
      default: () => {},
    },
  })

  const hideUI = ref(false)

  const photoCarouselRef = ref(null)

  const getActiveIndex = computed(() => {
    return photoCarouselRef.value ? photoCarouselRef.value.data.currentSlide.value : -1
  })

  const visibilityTransition = computed(() => (!hideUI.value ? 'visible' : 'visible hidden'))

  const photoLoaded = ref(false)

  // 檢查照片是否有效
  const pathValid = path => {
    const tempImg = new Image()
    tempImg.src = path
    tempImg.addEventListener('load', () => {
      photoLoaded.value = true
    })
    tempImg.addEventListener('error', () => {
      photoLoaded.value = false
    })
  }

  // 監聽 userId 變化
  watch(
    () => props.userId,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        init()
      }
    },
  )
  const init = async () => {
    if (!props.userId) return
    isLoading.value = true
    try {
      // 取得直播主資訊
      if (livePageStreamerInfo?.value) streamerInfo.value = livePageStreamerInfo.value
      else streamerInfo.value = await getStreamerInfo({ UserId: props.userId }).then(res => res.data)
      // 取得宣傳頁面內容
      const promotionalData = await getStreamerPromotional({ UserId: props.userId }).then(res => {
        const link = res.data.socialMediaLink
        return {
          ...res.data,
          // photos: [{ photoPath: defaultPhoto3, isDefaultPhoto: true }],
          photos: res.data.photos?.length ? res.data.photos : [{ photoPath: defaultPhoto3, isDefaultPhoto: true }],
          socialMediaLink: {
            facebook: link?.facebook ? 'https://www.facebook.com/' + link.facebook : '',
            instagram: link?.instagram ? 'https://www.instagram.com/' + link.instagram : '',
            x: link?.x ? 'https://x.com/' + link.x : '',
          },
        }
      })

      streamStore.setStreamerPromotional(promotionalData)
      isLoading.value = false
    } catch (e) {
      console.warn('直播主資料取得異常', e)
      streamStore.setStreamerPromotional({})
      streamerInfo.value = {}
    }
  }

  // 改由props function來打開直播時間
  const actionStreamerChannel = () => {
    props.openStreamerChannel()
  }

  const actionSocial = url => {
    window.open(url, '_blank')
  }

  const actionFollow = async bool => {
    if (!bool) {
      try {
        await ElMessageBox.confirm(t('要取消追蹤{name}嗎？', { name: ` ${streamerInfo.value.memberName} ` }), t('通知'), {
          confirmButtonText: t('是'),
          cancelButtonText: t('否'),
          cancelButtonClass: 'cancel-btn',
          showClose: false,
        })
      } catch {
        return
      }
    }

    try {
      const input = {
        userId: parseInt(props.userId),
        isFollow: bool,
      }
      await postFollowStreamer(input)
      const newPromotional = {
        ...streamerPromotional.value,
        isFollowed: bool,
      }
      streamStore.setStreamerPromotional(newPromotional)
    } catch (e) {
      ElMessage({
        showClose: true,
        message: t('追蹤失敗，請稍後再試'),
        type: 'error',
      })
    }
  }

  const toggleLike = async () => {
    // 判斷是否登入
    if (!memberInfo.value?.memberId) {
      ElMessage.warning({ message: t('登入或註冊後即可使用此功能') })
      return
    }
    // 確認數值
    try {
      if (activeIndex.value >= 0) {
        // 發動 api 按讚/取消按讚
        const result = await postLikeStreamerPromotionalPhoto({
          StreamerPromotionPhotoId: streamerPromotional.value.photos[activeIndex.value].streamerPromotionPhotoId,
        })

        // 察看結果
        if (result.Status) {
          if (result.Status.Code === '0') {
            const alteredData = JSON.parse(JSON.stringify(streamerPromotional.value))
            alteredData.photos[activeIndex.value].isLiked = result.data.isLiked
            alteredData.photos[activeIndex.value].likes += result.data.isLiked ? 1 : -1

            if (result.data.isLiked) {
              // 將會員資料推入陣列
              if (!alteredData.photos[activeIndex.value].likeMember) {
                alteredData.photos[activeIndex.value].likeMember = [memberInfo.value]
              } else {
                alteredData.photos[activeIndex.value].likeMember.push(memberInfo.value)
              }
            } else {
              // 將會員資料移除陣列
              const oldIndex = alteredData.photos[activeIndex.value].likeMember.findIndex(
                m => m.memberId === memberInfo.value.memberId,
              )
              alteredData.photos[activeIndex.value].likeMember.splice(oldIndex, 1)
            }

            streamStore.setStreamerPromotional(alteredData)
          }
        } else throw new Error()
      }
    } catch (e) {
      console.warn('按讚失敗 ', result)
    }
  }

  const slideToIndex = index => {
    if (photoCarouselRef.value && !hideUI.value) {
      photoCarouselRef.value.slideTo(index)
      activeIndex.value = index
    }
  }

  const arrowClick = direction => {
    if (!hideUI.value) {
      if (direction === 'left') {
        photoCarouselRef.value.prev()
        activeIndex.value -= activeIndex.value === 0 ? 0 : 1
      } else {
        photoCarouselRef.value.next()
        activeIndex.value += activeIndex.value === streamerPromotional.value.photos.length - 1 ? 0 : 1
      }
    }
  }

  watch(isInitReady, val => {
    if (val) init()
  })

  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    hideUI.value = false
  })
</script>

<style lang="scss" scoped>
  .view-streamer-promotional {
    height: 100%;

    .loading {
      background-color: #000000;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;

      .spinner-border {
        width: 30px;
        height: 30px;
        padding: 0;
      }
    }
    .promotional-main {
      height: 100%;
      display: flex;
      flex-direction: column;

      .intro {
        background-repeat: no-repeat;
        background-position: center;
        background-size: cover;
        height: 35%;
        border-radius: 15px;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
        width: 100%;
        margin-bottom: 10px;

        > div {
          background: linear-gradient(to top, #000000a2, #34303400);

          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;

          .avatar {
            flex-grow: 1;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            color: white;
            word-break: break-all;
            line-height: 1.2em;

            .el-avatar {
              min-width: 50px;
              min-height: 50px;
            }

            .id {
              font-size: 12px;
            }

            .flex-grow-1 {
              overflow: hidden;
              text-overflow: ellipsis;
              word-break: break-all;
              word-wrap: normal;
              white-space: nowrap;
              width: 10px;
            }
          }
          .end-btn {
            display: flex;
            height: 100%;
            flex-direction: column;
            justify-content: space-around;

            .hover {
              background-color: var(--main-red);
              color: white;
              border-color: var(--main-red);
            }
          }
        }
      }

      .intro-other {
        flex-grow: 1;
        border-radius: 15px;
        overflow: hidden;
        position: relative;

        .intro-content {
          height: 100%;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          color: white;
          justify-content: flex-end;

          .icons {
            position: absolute;
            top: 50%;
            right: 0;
            transform: translate(0, -50%);
            margin-left: auto;
            transition: all 0.1s ease-in-out;
          }

          .visible {
            opacity: 1;
            visibility: visible;
          }

          .hidden {
            opacity: 0;
            visibility: hidden;
          }

          .like {
            font-weight: bold;
            line-height: 20px;
            padding-right: 10px;
            margin-left: auto;
            width: fit-content;
            transition: all 0.1s ease-in-out;

            visibility: visible;

            .heart {
              width: fit-content;
              margin-bottom: 6px;
              > div {
                text-shadow: 0px 0px 4px #000000;
              }
              i {
                transition: all 0.2s ease;
              }
              &:hover > i {
                scale: 1.2;
              }
            }

            i {
              color: red;
              font-size: 25px;
              cursor: pointer;
              display: flex;
            }

            .liked-member {
              display: flex;
              width: fit-content;
              .member {
                border: 1px solid white;
              }
            }
          }
          .social-media {
            // display: flex;
            font-size: 20px;
            padding: 10px 12px;
            // justify-content: flex-end;

            > div {
              cursor: pointer;
              width: fit-content;
              margin-left: auto;
              transition: all 0.2s ease;

              &:hover {
                transition: all 0.2s ease;
                scale: 1.2;
              }
            }
          }
          .photo {
            width: 297px;
            height: 70px;
            margin: 0 auto;
            background: rgba(128, 132, 187, 0.3019607843);
            backdrop-filter: blur(10px);
            border-radius: 50px;
            margin-bottom: 25px;
            align-items: center;
            .custom-arrow {
              // margin: 0 20px;
              width: 10px;
              height: 20px;
              font-size: larger;
              margin-bottom: 4px;
            }
            .photo-carousel {
              // height: 16%;
              margin: 0 auto;
              bottom: -8px;
              .carousel__slide {
                width: unset !important;
                // aspect-ratio: 3.5/3;
                .slide-item {
                  width: 48px;
                  height: 48px;
                  background-repeat: no-repeat;
                  background-size: cover;
                  background-position: center;
                  border-radius: 15px;
                  margin: 0 8px;
                  overflow: hidden;
                  cursor: pointer;

                  :deep(.el-image) img {
                    width: 48px;
                    height: 48px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
</style>
