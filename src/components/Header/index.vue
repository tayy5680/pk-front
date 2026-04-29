<template>
  <header class="d-flex container py-3" :class="{ mobile: isMobile }">
    <div class="logo" @click="backToHall">
      <img :src="logo" alt="Logo" />
    </div>
    <div class="currency d-flex header-option" :style="`color:white;`">
      <!-- 已登入介面 -->
      <div v-if="Object.keys(memberInfo).length" class="login-ui">
        <ViewNotification />
        <el-button v-if="!isMobile" class="system-btn me-3" @click="goToSystemPage">
          <i class="bi bi-gear"></i>
        </el-button>
        <div v-if="!isMobile" class="user-info me-3" @click="goToMemberPage">
          <el-avatar class="me-3" :size="36" :src="memberInfo.photoPath">
            <img :src="userPhoto" />
          </el-avatar>
        </div>
        <div v-if="!isMobile" class="wallet-point">
          <el-image :src="goldImg" fit="cover" />
          <span class="ps-2">{{ walletPoint }}</span>
        </div>

        <!-- 已登入的手機用選單 -->
        <ViewMobileMenu v-if="isMobile" />
      </div>
      <!-- 訪客介面 -->
      <div v-if="!Object.keys(memberInfo).length" class="login-btn-group">
        <el-button class="system-btn" @click="goToSystemPage">
          <i class="bi bi-gear"></i>
        </el-button>
        <!-- <el-button class="login-btn" @click="setRegisterVisible(false)">{{ $t('登入') }}</el-button>
        <el-button class="register-btn" @click="setRegisterVisible(true)">{{ $t('註冊') }}</el-button> -->
      </div>
    </div>
  </header>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import logo from '@/assets/image/hall/COFUN_logo.svg'
  import langIcon from '@/assets/image/hall/icon_lang.png'
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import ViewLanguage from '@/components/Language/index.vue'
  import { ref, onMounted, computed, watch, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useStream, useDonate } from '@/store/live.js'
  import ViewNotification from './Dropdown/Notification.vue'
  import ViewMobileMenu from './Dropdown/MobileMenu.vue'
  import { storeToRefs } from 'pinia'

  const defaultSettingStore = useDefaultSetting()
  const { screenWidth, memberInfo, isAppInitReady, isMobile } = storeToRefs(defaultSettingStore)
  const donateStore = useDonate()
  const { walletPoint } = storeToRefs(donateStore)
  const { calculateCss } = defaultSettingStore
  const router = useRouter()
  const route = useRoute()
  const isDotVisible = ref(false)

  const customFontSize = computed(() => (screenWidth.value > 500 ? 16 : 14))
  const customDropdownRef = ref(null)
  const customDropdownStyle = ref('')
  const displayLangOptions = ref(false)
  const displayDropdown = () => {
    if (customDropdownRef.value) {
      const { offsetTop, offsetLeft, clientHeight } = customDropdownRef.value
      customDropdownStyle.value = `transform: translate(${offsetLeft < 100 ? offsetLeft / 1.5 : 0}px, ${offsetTop + clientHeight + 16}px);`
      displayLangOptions.value = !displayLangOptions.value
    }
  }
  const setRegisterVisible = isRegister => {
    defaultSettingStore.setRegisterVisible({ isVisible: true, isRegister: isRegister })
  }
  // 聆聽 resize 事件
  watch(
    () => screenWidth.value,
    (newVal, oldVal) => {
      if (newVal && displayLangOptions.value) {
        nextTick(() => {
          setTimeout(() => {
            console.log('customDropdownRef :>>>', customDropdownRef.value)
            const { offsetTop, offsetLeft, clientHeight } = customDropdownRef.value
            customDropdownStyle.value = `transform: translate(${offsetLeft < 100 ? offsetLeft / 1.5 : 0}px, ${offsetTop + clientHeight + 16}px);`
          }, 50)
        })
      }
    },
  )

  const backToHall = () => {
    router.push(`/${window.location.search}`)
  }

  const goToMemberPage = () => {
    router.push(`/Member${window.location.search}`)
  }

  const goToSystemPage = () => {
    router.push(`/system${window.location.search}`)
  }

  const isMobileMenuVisible = ref(false)
</script>
<style lang="scss" scoped>
  .bell-title {
    border-bottom: 1px solid rgb(64, 82, 119);
    padding: 5px 0 14px 0;
  }
  header {
    align-items: center;
    .logo img {
      cursor: pointer;
      width: auto;
      height: 50px;
    }
    .currency {
      margin-left: auto;
      align-items: center;

      .login-ui {
        display: flex;
        align-items: center;
        height: 36px;

        .user-info {
          width: 36px;
          height: 36px;
          cursor: pointer;
        }

        .wallet-point {
          height: 36px;
          border: 1px solid #6c6c6c;
          border-radius: 50px;
          margin: 0;
          display: flex;
          align-items: center;
          padding: 0 6px;
          min-width: 100px;
        }
      }

      button {
        background-color: #ffffff00;
        color: white;
        font-size: 16px;
        border: 0;

        &.system-btn {
          font-size: 25px;
          padding: 18px 5px;
          width: 36px;
          height: 36px;
          margin: 0;

          &:hover {
            background-color: #3a4359;
          }
        }
      }
      .el-image {
        width: 25px;
        height: 25px;
        border-radius: 50%;
      }
      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 14.0625vw;
      }

      .login-btn-group {
        display: flex;
        button {
          padding-left: 25px;
          padding-right: 25px;
        }

        .login-btn {
          background-color: white;
          color: var(--main-red);
        }
        .register-btn {
          background: linear-gradient(to right, #306aff, #f12889);
          color: #ffffff;
        }
      }
    }

    &.mobile {
      margin: 0;
      width: 100%;
      max-width: 100%;
    }

    .avatar {
      cursor: pointer;
      align-items: center;
      span {
        white-space: nowrap;
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
  }
</style>
