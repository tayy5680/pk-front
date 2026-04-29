<template>
  <ul>
    <li
      v-for="lang in LANGUAGE_LIST"
      :key="lang.id"
      :style="`padding: 0 ${calculateCss(12)}vw;`"
      @click="setLocale(lang.id)"
    >
      <button
        :style="`${locale === lang.id ? 'color: #FF2D55; text-decoration: underline;' : ''} ${screenWidth < 500 ? 'padding-left: unset; padding-right: unset;' : ''}`"
      >
        {{ lang.local }}
      </button>
    </li>
  </ul>
</template>

<script setup>
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useRoute } from 'vue-router'

  const defaultSettingStore = useDefaultSetting()
  const { setLanguage, calculateCss } = defaultSettingStore
  const { screenWidth } = storeToRefs(defaultSettingStore)
  const { locale } = useI18n()
  const route = useRoute()

  const setLocale = lang => {
    setLanguage(lang)
  }
</script>

<style lang="scss" scoped>
  ul {
    padding: 0;
    list-style: none;
    text-align: start;
    font-size: 16px;
    li {
      &:hover {
        background-color: #3a4359;
      }
      button {
        background: none;
        border: none;
        color: white;
      }
    }
  }
</style>
