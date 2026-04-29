<template>
  <div class="view-download">
    <p>Redirecting...</p>
  </div>
</template>

<script setup>
  import { onMounted } from 'vue'

  const COFUN_APP_URL = {
    iOS: 'https://apps.apple.com/tw/app/%E9%85%B7%E7%8E%A9%E7%9B%B4%E6%92%AD/id6746150643',
    Android: 'https://play.google.com/store/apps/details?id=live.cofun.streamer&pcampaignid=web_share',
  }
  function getClientOS() {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS'
    if (/Macintosh|Mac OS X/i.test(ua)) return 'iOS'
    if (/Android/i.test(ua)) return 'Android'
    return 'iOS'
  }

  onMounted(() => {
    const os = getClientOS()
    window.location.replace(COFUN_APP_URL[os])
  })
</script>
<style scoped>
  .view-download {
    color: white;
    height: calc(100svh - 78px);
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
