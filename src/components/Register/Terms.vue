<template>
  <div class="view-register-terms">
    <h3 class="fw-bold pb-4">{{ $t('Cofun LIVE的《條款與政策》') }}</h3>
    <div class="body">
      <i18n-t
        keypath="若使用位於{country}的帳號繼續操作點擊［同意並繼續］即表示您同意我們的{termsOfService}及並確認您已閱讀我們的{privacyPolicy}，了解我們如何收集、使用與分享您的資料。"
        tag="span"
        scope="global"
      >
        <template #country>
          <div class="color-red">{{ $t('台灣') }}</div>
        </template>
        <template #termsOfService>
          <button class="btn" @click="action('TermsOfService')">{{ $t('服務條款') }}</button>
        </template>
        <template #privacyPolicy>
          <button @click="action('PrivacyPolicy')">《{{ $t('隱私權政策') }}》</button>
        </template>
      </i18n-t>
    </div>
    <el-button class="confirm" round @click="processData.step = 2">{{ $t('同意並繼續') }}</el-button>
  </div>
</template>

<script setup>
  import { ref, inject, watch } from 'vue'
  import { useRouter } from 'vue-router'

  const processData = inject('processData')
  const router = useRouter()
  const action = pageType => {
    const url = router.resolve({ path: '/LegalInformation/' + pageType }).href
    window.open(url, '_blank')
  }
</script>

<style lang="scss" scoped>
  .view-register-terms {
    display: flex;
    flex-direction: column;

    .body {
      flex-grow: 1;
      .color-red,
      button {
        display: inline-block;
        color: var(--main-red);
        font-weight: bold;
        padding: 0 5px;
        background-color: #ffffff00;
      }
      button:hover {
        text-decoration: underline;
      }
    }
    .confirm {
      background: linear-gradient(to right, #306aff, #f12889);
      border: none;
      color: #ffffff;
      width: 100%;
    }
  }
</style>
