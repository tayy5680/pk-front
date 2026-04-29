<template>
  <el-dialog
    modal-class="view-streamer-promotional"
    v-model="isStreamerPromotionalVisible"
    title="Warning"
    align-center
    :before-close="close"
    :show-close="true"
    :destroy-on-close="true"
  >
    <ViewStreamerPromotional :userId="userId" :openStreamerChannel="() => (isOpenChannelPage = true)" />
    <ViewStreamerChannel
      :class="{ action: isOpenChannelPage }"
      :userId="userId"
      :back-function="() => (isOpenChannelPage = false)"
    />
  </el-dialog>
</template>

<script setup>
  import ViewStreamerPromotional from '@/components/StreamerPromotional/index.vue'
  import ViewStreamerChannel from '@/components/StreamerPromotional/StreamerChannel.vue'
  import { ref, computed, watch } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { useRouter, useRoute } from 'vue-router'
  const router = useRouter()
  const route = useRoute()
  const streamStore = useStream()
  const defaultSettingStore = useDefaultSetting()
  const { isAppInitReady } = storeToRefs(defaultSettingStore)
  const { isStreamerPromotionalVisible } = storeToRefs(streamStore)

  const userId = computed(() => Number(route.params.userId) ?? 0)
  const isReady = computed(() => Boolean(userId.value) && isAppInitReady.value)
  const isOpenChannelPage = ref(false)

  const centerDialogVisible = ref(false)
  const close = () => {
    streamStore.setStreamerPromotionalVisible(false)
    streamStore.setPreviewImgVisible(false)
    if (route.path.includes('StreamerPromotional')) {
      const basePath = `/${route.path.split('/')[1]}${window.location.search}`
      router.push(basePath)
    }
  }
  const streamDataList = ref([])

  // 監聽路徑開關
  watch(isReady, val => {
    if (val) {
      streamStore.setStreamerPromotionalVisible(true)
      isOpenChannelPage.value = false
    } else close()
  })
</script>

<style lang="scss" scope>
  .view-streamer-promotional {
    width: 100%;
    .el-dialog {
      background-color: rgba(0, 0, 0, 0);
      height: calc(-80px + 100svh);
      max-width: 350px;
      width: calc(100% - 40px);
      padding: 0;
      overflow: hidden;

      .el-dialog__header {
        display: none;
      }

      .el-dialog__body {
        height: 100%;
        border-radius: 15px;
        overflow: hidden;
      }

      .view-streamer-channel {
        transition: 0.3s all ease;
        position: absolute;
        top: 0;
        right: -100%;

        &.action {
          right: 0;
        }
      }
    }
  }
</style>
