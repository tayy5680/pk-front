<template>
  <div class="view-mainenance" :class="{ mo: isMobile }" v-loading="isRefreshLoading">
    <el-image :src="isMobile ? maintenanceData?.appMaintenanceImgUrl : maintenanceData?.webMaintenanceImgUrl" :fit="'contain'">
      <template #error>
        <div class="img-err">
          <div class="icon"><i class="bi bi-tools"></i></div>
          <h1>Mainenance</h1>
          <h5>系統維護中</h5>
          <el-button type="warning" round @click="refreshMaintenanceStatus">
            <i class="bi bi-arrow-clockwise"></i> 重新整理
          </el-button>
        </div>
      </template>
    </el-image>
  </div>
</template>

<script setup>
  import { ref, watch, inject, onMounted } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'
  const defaultSettingStore = useDefaultSetting()
  const { isMaintenance, maintenanceData, isMobile } = storeToRefs(defaultSettingStore)
  const router = useRouter()
  const isRefreshLoading = ref(false)

  watch(isMaintenance, val => {
    if (val === false) {
      window.location.reload()
    }
  })

  const refreshMaintenanceStatus = async () => {
    if (isMaintenance.value === false) return router.push('/')
    isRefreshLoading.value = true
    // 檢測網站是否維護中 (延遲三秒)
    setTimeout(async () => {
      window.location.reload()
    }, 3000)
  }
  onMounted(() => {
    if (isMaintenance.value === false) window.location.href = '/'
  })
</script>
<style lang="scss" scoped>
  .view-mainenance {
    background-color: #ffffff;
    inset: 0;
    position: fixed;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;

    :deep(.el-image) {
      height: 100%;
      width: 100%;
      max-width: 600px;

      .img-err {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;

        .icon {
          font-size: 40px;
        }

        button {
          margin-top: 15px;
          i {
            padding-right: 10px;
          }
        }
      }
    }

    &.mo {
      padding: 20px;
      :deep(.el-image) {
        max-width: 700px;
      }
    }
  }
</style>
