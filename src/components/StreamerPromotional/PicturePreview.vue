<template>
  <el-image-viewer
    v-if="isPreviewImgVisible"
    :url-list="previewSrcList"
    :initial-index="previewImgActiveIndex"
    infinite
    :hide-on-click-modal="true"
    @close="streamStore.setPreviewImgVisible(false)"
  />
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  const streamStore = useStream()
  const { streamerPromotional, isPreviewImgVisible, previewImgActiveIndex } = storeToRefs(streamStore)
  

  const viewerVisible = ref(false)
  const actionPictureExpand = () => {
    viewerVisible.value = true
  }
  const previewSrcList = computed(() => {
    if (!streamerPromotional.value?.photos?.length) return []
    return streamerPromotional.value.photos.map(x => x.photoPath)
  })
</script>

<style lang="scss" scoped></style>
