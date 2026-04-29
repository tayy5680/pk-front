<template>
  <div class="view-sub-menu-language">
    <div class="main-title">
      <button @click="close" class="back"><i class="bi bi-chevron-left"></i></button>
      <div>{{ $t('返回') }}</div>
    </div>
    <div class="sub-main-content">
      <div
        v-for="(item, index) in LANGUAGE_LIST"
        :key="index"
        @click="actionSetLanguage(item.id)"
        :class="['main', { red: locale === item.id }]"
      >
        {{ $t(item.label) }} ({{ item.local }})
      </div>
    </div>
  </div>
</template>

<script setup>
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()

  const props = defineProps({
    close: {
      type: Function,
    },
  })
  const defaultSettingStore = useDefaultSetting()
  const actionSetLanguage = lang => {
    defaultSettingStore.setLanguage(lang)
  }
</script>
<style lang="scss" scoped>
  .view-sub-menu-language {
    .sub-main-content {
      padding-top: var(--main-title-height);

      .main {
        display: flex;
        align-items: center;
        border-radius: 10px;
        padding: 10px 20px;
        cursor: pointer;
        max-height: 60px;

        &.red {
          color: var(--main-red);
        }
      }
    }

    :deep(.el-loading-mask) {
      background-color: #000000a1;
      .el-loading-spinner .path {
        stroke: white;
      }
    }
  }
</style>
