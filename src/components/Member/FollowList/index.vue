<template>
  <div class="view-follow-list">
    <el-button v-if="playerFollowList.count > 0" class="sort-btn" @click="actionSort">
      {{ isNewestFirst ? $t('按新到舊排序') : $t('按舊到新排序') }}
      <i :class="`bi bi-chevron-${isNewestFirst ? 'down' : 'up'} ps-1`"></i>
    </el-button>
    <div class="main-list" :class="{ descending: isNewestFirst }">
      <div
        v-for="(item, index) in playerFollowList.list"
        :key="index"
        class="list-items"
        :class="[
          { 'border-b': isNewestFirst ? index > 0 : index < playerFollowList.list.length - 1 },
          { 'd-none': !item.isFollow },
        ]"
      >
        <el-avatar class="me-3" :size="50" :src="item.photoPath">
          <img :src="userPhoto" />
        </el-avatar>
        <div class="name">
          <div>{{ item.name }}</div>
          <div class="account">@{{ item.account }}</div>
        </div>
        <!-- <el-button class="opacity-red-btn" round :class="{ hover: !item.isFollow }" @click="actionFollow(index)">
          {{ item.isFollow ? $t('追蹤中') : $t('追蹤') }}
        </el-button> -->
        <el-button class="promote_btn" round @click="actionPromotional(item)">{{ $t('宣傳頁') }}</el-button>
      </div>
    </div>

    <div v-if="playerFollowList.count === 0" class="text-center">{{ $t('目前沒有正在追蹤的對象') }}</div>
  </div>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, inject } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { postFollowStreamer } from '@/api/stream.js'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  const router = useRouter()
  const { t, locale } = useI18n()
  const actionGetPlayerFollowList = inject('actionGetPlayerFollowList')

  const props = defineProps({
    playerFollowList: {
      type: Object,
      default: () => ({
        count: 0,
        list: [],
      }),
    },
  })
  // css 排序
  const isNewestFirst = ref(true)
  const actionSort = () => {
    isNewestFirst.value = !isNewestFirst.value
  }

  const actionFollow = async index => {
    const item = props.playerFollowList.list[index]
    if (item.isFollow) {
      try {
        await ElMessageBox.confirm(t('要取消追蹤{name}嗎？', { name: ` ${item.name} ` }), t('通知'), {
          confirmButtonText: t('是'),
          cancelButtonText: t('否'),
          cancelButtonClass: 'cancel-btn',
          showClose: false,
        })
      } catch {
        return
      }
    }

    try {
      props.playerFollowList.list[index].isFollow = !item.isFollow
      const input = {
        userId: item.userId,
        isFollow: false,
      }
      await postFollowStreamer(input)
      await actionGetPlayerFollowList()
    } catch (e) {
      console.error(e)
      ElMessage({
        showClose: true,
        message: t('追蹤失敗，請稍後再試'),
        type: 'error',
      })
      await actionGetPlayerFollowList()
    }
  }

  const actionPromotional = async item => {
    // 顯示彈窗
    router.push(`/Member/StreamerPromotional/${item.userId}${window.location.search}`)
  }
</script>
<style lang="scss" scoped>
  .view-follow-list {
    .main-list {
      display: flex;
      flex-direction: column;
      &.descending {
        flex-direction: column-reverse;
      }
      .list-items {
        display: flex;
        padding: 20px 0;
        align-items: center;

        :deep(.el-avatar) {
          flex-shrink: 0;
        }

        .name {
          flex-grow: 1;
          word-break: break-all;

          .account {
            font-size: 12px;
          }
        }

        .opacity-red-btn.hover {
          background-color: var(--main-red);
          color: white;
          border-color: var(--main-red);
        }

        .promote_btn {
          transition: 0.2s all ease;
          background: linear-gradient(to right, #306aff, #e60572);
          border: 0;
          color: #ffffff;
        }

        &.border-b {
          border-bottom: 1px solid #405277;
        }
      }
    }
    .sort-btn {
      background-color: rgba(0, 255, 255, 0);
      color: var(--main-dark-text);
      border: 0;
      padding: 5px 0;
      font-size: 16px;
    }

    :deep(.promotional-dialog) {
      background-color: rgba(214, 20, 149, 0);
      height: calc(-40px + 100svh);

      .el-dialog__header {
        display: none;
      }

      .el-dialog__body {
        height: 100%;
        border-radius: 15px;
        overflow: hidden;
      }
    }
  }
</style>
