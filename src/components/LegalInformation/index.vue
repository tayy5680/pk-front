<template>
  <div class="view-terms-of-service">
    <div class="container page-container">
      <div class="pb-5">
        <h2>{{ $t(nowPage.title) }}</h2>
        <small>{{ $t('最後更新時間：') }}2025/07</small>
      </div>
      <Component :is="nowPage.conponent" />
    </div>
  </div>
</template>

<script setup>
  import ViewTermsOfService_TW from './TermsOfService/tw.vue'
  import ViewIntellectualProperty_TW from './IntellectualProperty/tw.vue'
  import ViewUserGuidelines_TW from './UserGuidelines/tw.vue'
  import ViewPrivacyPolicy_TW from './PrivacyPolicy/tw.vue'
  import { computed } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  const defaultSettingStore = useDefaultSetting()
  const { language } = storeToRefs(defaultSettingStore)

  const props = defineProps({
    pageType: {
      type: String,
      default: () => '',
    },
  })
  const PAGE_TYPE = [
    { id: 'PrivacyPolicy', title: '隱私權政策', conponent: ViewPrivacyPolicy_TW },
    { id: 'TermsOfService', title: '服務條款', conponent: ViewTermsOfService_TW },
    { id: 'UserGuidelines', title: '使用者規範', conponent: ViewUserGuidelines_TW },
    { id: 'IntellectualProperty', title: '智慧財產權', conponent: ViewIntellectualProperty_TW },
  ]

  const nowPage = computed(() => PAGE_TYPE.find(x => x.id === props.pageType))
</script>

<style lang="scss" scoped>
  .view-terms-of-service {
    .page-container {
      padding-top: 50px;
      padding-bottom: 100px;
      color: white;
    }
    @media (min-width: 768px) {
      .page-container {
        max-width: 768px;
      }
    }
  }
</style>
