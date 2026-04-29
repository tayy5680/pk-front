<template>
  <div class="view-register-form">
    <div class="title">
      <div class="progressing pb-3" v-if="processData.isRegister">
        <div v-for="n in 3" :key="n" :class="{ action: n === processData.typeStep }"></div>
      </div>
      <h3 class="fw-bold m-0">{{ $t(titleObject.label) }}</h3>
      <p class="m-0">{{ $t(titleObject.sub) }}</p>
    </div>
    <!-- step 1: 手機登入寄送otp簡訊 -->
    <ViewStep1 v-if="processData.typeStep === 1" />
    <!-- step 2: 填寫註冊資料-->
    <ViewStep2 v-if="processData.typeStep === 2" />
    <!-- step 3: 實名驗證 -->
    <ViewStep3 v-if="processData.typeStep === 3" />
  </div>
</template>

<script setup>
  import ViewStep1 from './FormStep1.vue'
  import ViewStep2 from './FormStep2.vue'
  import ViewStep3 from './FormStep3.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { postCheckPhoneLogin } from '@/api/verification.js'
  import { ref, computed, provide, inject } from 'vue'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useRoute } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useI18n } from 'vue-i18n'
  const defaultSettingStore = useDefaultSetting()
  const { locale, t } = useI18n()
  const route = useRoute()

  const formData = ref({
    account: '',
    countryCode: locale.value.split('-')[1].toLowerCase(),
    phoneValidate: '',
    otp: '',
    phone: '',
    country: 'TW',
    fullName: '',
    birthday: {
      yy: '',
      mm: '',
      dd: '',
    },
    email: '',
    nickName: '',
    invitationCode: '',
    gender: '',
    idNumber: '',
    idCardFrontPhoto: [],
    idCardBackPhoto: [],
  })
  provide('formData', formData)

  const processData = inject('processData')
  const titleObject = computed(() => {
    switch (processData.value.typeStep) {
      case 1:
        if (processData.value.isRegister) {
          let typeList = {
            phone: { label: '手機註冊', sub: '收取簡訊快速驗證' },
            line: { label: 'LINE註冊', sub: 'LINE快速註冊' },
            apple: { label: 'APPLE ID註冊', sub: 'APPLE ID快速註冊' },
          }
          return typeList[processData.value.type]
        } else return { label: '手機登入', sub: '手機號碼快速登入' }
      case 2:
        return { label: '基本資料', sub: '設定專屬暱稱與推薦碼' }
      case 3:
        // 在會員頁面時，顯示不同名稱
        if (route.name === 'Member') return { label: '實名收益啟動', sub: '' }
        return { label: '個人實名驗證', sub: '可以在個人資訊頁面修改' }
      default:
        return { label: '', sub: '' }
    }
  })
</script>

<style lang="scss" scoped>
  .view-register-form {
    display: flex;
    flex-direction: column;
    height: auto;
    justify-content: space-between;
    width: 100%;

    .title {
      .progressing {
        display: flex;
        > div {
          background-color: #bbcbf4;
          width: 50px;
          height: 7px;
          border-radius: 30px;
          margin-right: 5px;

          &.action {
            background-color: #3263de;
          }
        }
      }
    }
  }
</style>
