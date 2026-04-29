<template>
  <el-drawer
    class="darkDrawer bg-white"
    v-model="drawerList.streamerChannel"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    size="85%"
  >
    <div class="main-menu">
      <ViewStreamerChannel :userId="channelData.userId" :backFunction="closeDrawer" />
    </div>
  </el-drawer>
</template>

<script setup>
  import { ref, inject } from 'vue'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import ViewStreamerChannel from '@/components/StreamerPromotional/StreamerChannel.vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const streamStore = useStream()
  const { channelData } = storeToRefs(streamStore)
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')

  const closeDrawer = () => {
    setDrawer('streamerChannel', false)
  }
</script>

<style lang="scss" scoped></style>
