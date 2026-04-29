<template>
  <el-drawer
    class="darkDrawer donate"
    v-model="drawerList.donate"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    :size="'60%'"
  >
    <div class="main-menu">
      <ViewDonateList :closeDonateDrawer="closeDrawer" />
    </div>
  </el-drawer>
</template>

<script setup>
  import { inject } from 'vue'
  import ViewDonateList from '../DonateList.vue'
  import { storeToRefs } from 'pinia'
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')

  const closeDrawer = () => {
    setDrawer('donate', false)
  }
</script>
<style lang="scss">
  .el-drawer.darkDrawer.donate {
    border-radius: 15px;
    border: 1px solid #3a4b70;

    .main-menu {
      padding: 0;
    }

    .el-drawer__body {
      padding: 0px;
    }

    .donate-event {
      display: none;
    }
  }
</style>
