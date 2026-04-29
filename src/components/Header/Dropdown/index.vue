<template>
    <div :style="`width: ${calculateCss(320)}vw; border-radius: ${calculateCss(20)}vw; background-color: #242A37; border: 1px solid #405277; margin: 0;`">
        <p :style="`margin: ${calculateCss(20)}vw 0 0 0; padding: ${calculateCss(13)}vw 0;cursor: unset;`" @click.stop=""> {{ $t("選擇語言") }} </p>
        <Language />
    </div>
</template>

<script setup>
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import Language from '@/components/Language/index.vue'

  const defaultSettingStore = useDefaultSetting()
  const { calculateCss } = defaultSettingStore
</script>

<style lang="scss" scoped>
div{
    position: absolute;
    z-index: 10;
    top: 0;
    font-size: 16px;
    P{
        color: white;
        text-align: center;
    }
}
</style>
