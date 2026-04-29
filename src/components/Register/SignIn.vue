<template>
  <div class="view-register-sign-in">
    <h3 class="fw-bold m-0">{{ $t(processData.isRegister ? '註冊' : '登入') }}</h3>
    <p class="m-0">{{ $t(`請選擇一種${processData.isRegister ? '註冊' : '登入'}方式`) }}</p>
    <div class="body">
      <button v-for="(item, index) in buttonList" :key="index" :class="item.id" @click="nextStep(item)">
        {{ $t(item.label) }}
      </button>
    </div>
    <div class="footer">
      {{ processData.isRegister ? $t('已有帳號？') : $t('還沒有帳號？') }}
      <button @click="toggleAuthMode">
        {{ processData.isRegister ? $t('登入') : $t('註冊') }}
      </button>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, inject } from 'vue'
  const processData = inject('processData')

  const buttonList = computed(() => {
    return [
      {
        id: 'phone',
        label: `使用手機號碼${processData.value.isRegister ? '註冊' : '登入'}`,
        icon: 'bi-telephone-fill',
      },
      { id: 'line', label: `使用LINE${processData.value.isRegister ? '註冊' : '登入'}`, icon: 'bi-line' },
      { id: 'apple', label: `使用APPLE ID${processData.value.isRegister ? '註冊' : '登入'}`, icon: 'bi-apple' },
    ]
  })

  const toggleAuthMode = () => {
    processData.value.isRegister = !processData.value.isRegister
    if (processData.value.isRegister) processData.value.step = 1
  }

  const nextStep = item => {
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    switch (item.id) {
      case 'line':
        if (locationParamsObject?.referralCode) localStorage.setItem('referralCode', locationParamsObject.referralCode)
        actionLineSignIn()
        break
      case 'apple':
        if (locationParamsObject?.referralCode) localStorage.setItem('referralCode', locationParamsObject.referralCode)
        actionAppleSignIn(locationParamsObject?.referralCode)
        break
      case 'phone':
        // 註冊流程
        processData.value.type = item.id
        processData.value.step = 3
        processData.value.typeStep = 1
        break
    }
  }
  const actionLineSignIn = () => {
    let link = 'https://access.line.me/oauth2/v2.1/authorize?'
    link += 'response_type=code'
    link += '&client_id=' + import.meta.env.VITE_LINE_CLIENT_ID
    link += '&redirect_uri=' + import.meta.env.VITE_LINE_REDIRECT_URI
    link += '&state=login'
    link += '&scope=openid%20profile'

    window.location.assign(link)
  }

  const actionAppleSignIn = () => {
    let link = 'https://appleid.apple.com/auth/authorize?'
    link += 'response_type=code'
    link += '&client_id=' + import.meta.env.VITE_APPLE_CLIENT_ID
    link += '&redirect_uri=' + import.meta.env.VITE_APPLE_REDIRECT_URI
    link += '&state=login'

    window.location.assign(link)
    return
  }
</script>

<style lang="scss" scoped>
  .view-register-sign-in {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;

    .body {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 40px 0;

      button {
        width: 100%;
        display: block;
        color: white;
        border-radius: 50px;
        margin: 8px 0;

        &:hover {
          opacity: 0.8;
        }

        &.phone {
          background-color: #2b3856;
        }
        &.line {
          background-color: #06c755;
        }
        &.apple {
          background-color: black;
        }
      }
    }
    .footer {
      button {
        background-color: white;
        padding: 0;
        display: inline-block;
        color: var(--main-red);
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
</style>
