<template>
  <el-drawer
    class="darkDrawer"
    v-model="drawerList.onlineMembersList"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    :size="'60%'"
  >
    <div class="main-title">
      <div>
        {{ $t('觀看者人數') }}
        <span><i class="bi bi-eye pe-2"></i>{{ onlineMembers.length }}</span>
      </div>
    </div>
    <div class="main-menu">
      <div class="list">
        <div class="d-flex list-item" v-for="(item, index) in onlineMembers" :key="index">
          <el-avatar :size="40" fit="cover" :src="item.PhotoPath" class="me-3">
            <img :src="userPhoto" />
          </el-avatar>
          <div class="flex-grow-1 memberName">{{ item.MemberName }}</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
  import { inject } from 'vue'
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  const streamStore = useStream()
  const { onlineMembers } = storeToRefs(streamStore)
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')

  const closeDrawer = () => {
    setDrawer('onlineMembersList', false)
  }
</script>

<style lang="scss" scoped>
  .el-drawer.darkDrawer .el-drawer__body .main-menu {
    padding: 60px 0px 12px 0px;
    .list {
      .list-item {
        cursor: default;
        background-color: inherit;
        padding-top: 0;
        &:hover {
          background-color: inherit;
        }

        .el-avatar {
          flex-shrink: 0;
        }

        .memberName {
          width: 80%;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
</style>
