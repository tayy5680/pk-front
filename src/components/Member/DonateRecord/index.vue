<template>
  <div class="view-donate-record-list">
    <el-button v-if="recordList.length > 0" class="sort-btn" @click="actionSort">
      {{ isNewestFirst ? $t('按新到舊排序') : $t('按舊到新排序') }}
      <i :class="`bi bi-chevron-${isNewestFirst ? 'down' : 'up'} ps-1`"></i>
    </el-button>
    <div class="main-list" :class="{ descending: isNewestFirst }">
      <div
        v-for="(streamerItem, streamerIndex) in recordList"
        :key="streamerIndex"
        class="record-item"
        :class="{ 'border-b': isNewestFirst ? streamerIndex > 0 : streamerIndex < recordList.length - 1 }"
      >
        <div class="title d-flex">
          <el-avatar class="me-3" :size="50" :src="streamerItem[0].photoPath">
            <img :src="userPhoto" />
          </el-avatar>
          <div>
            <div>{{ streamerItem[0].name }}</div>
            <div class="color-gray">{{ streamerItem[0].date }}</div>
          </div>
        </div>
        <div v-for="(item, index) in streamerItem" :key="index">
          <small class="color-gray">{{ $t('單號') }}： {{ item.donateRecorId }}</small>
          <div class="streamer-item">
            <div class="created">{{ item.time }}</div>
            <div :class="['message', { 'color-gray': !item.message }]">
              {{ item.message ? item.message : $t('無留言') }}
            </div>
            <div class="price">
              <img :src="goldImg" />
              {{ (item.price * item.amount).toLocaleString('en-US') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="recordList.length === 0" class="text-center">{{ $t('目前沒有紀錄') }}</div>
  </div>
</template>

<script setup>
  import goldImg from '@/assets/image/donate/icon_coin_gold.png'
  import userPhoto from '@/assets/image/default/user.jpeg'
  import { ref, computed } from 'vue'
  import dayjs from 'dayjs'
  import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()

  const props = defineProps({
    playerDonateRecordList: {
      type: Array,
      default: () => [],
    },
  })

  const recordList = computed(() => {
    return Object.values(
      props.playerDonateRecordList.reduce((acc, item) => {
        const newItem = {
          ...item,
          date: dayjs(item.created).format('YYYY-MM-DD'),
          time: dayjs(item.created).format('HH:mm'),
        }
        const key = `${newItem.date}-${item.name}`
        if (!acc[key]) acc[key] = []
        acc[key].push(newItem)
        return acc
      }, {}),
    )
  })
  // css 排序
  const isNewestFirst = ref(true)
  const actionSort = () => {
    isNewestFirst.value = !isNewestFirst.value
  }
</script>
<style lang="scss" scoped>
  .view-donate-record-list {
    .main-list {
      display: flex;
      flex-direction: column;
      &.descending {
        flex-direction: column-reverse;
      }
      .record-item {
        padding: 15px 0;

        &.border-b {
          border-bottom: 1px solid #405277;
        }
        .title {
          padding: 15px 0 20px 0;
        }
      }

      .color-gray {
        color: var(--main-dark-text);
      }

      .streamer-item {
        background-color: #242a37;
        border-radius: 15px;
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        .created {
          width: 100px;
        }
        .created,
        .price {
          flex-shrink: 0;
          padding: 10px 20px;
          display: flex;
          align-items: center;

          img {
            width: 16px;
            height: auto;
            margin-top: 3px;
            margin-right: 5px;
          }
        }
        .message {
          flex-grow: 1;
          word-break: break-all;
        }
      }
    }

    .sort-btn {
      background-color: rgba(0, 255, 255, 0);
      color: var(--main-dark-text);
      border: 0;
      padding: 5px 0;
      font-size: 16px;
      margin-right: 5px;
    }
  }
</style>
