<template>
  <el-drawer
    class="darkDrawer streamer-promotional-menu"
    v-model="drawerList.streamerPromotionalMenu"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    size="auto"
  >
    <div class="main-menu">
      <div class="list">
        <div class="share list-item" @click="shareDrawer"><img :src="getUrl('share.svg')" />{{ $t('直播分享') }}</div>
        <div class="report list-item" @click="reportDrawer"><img :src="getUrl('report.svg')" />{{ $t('檢舉') }}</div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
  import userPhoto from '@/assets/image/default/user.jpeg'
  import defaultPhoto2 from '@/assets/image/hall/default_photo_2.svg'
  import { inject } from 'vue'
  import dayjs from 'dayjs'
  import duration from 'dayjs/plugin/duration'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')
  const streamerInfo = inject('streamerInfo')

  dayjs.extend(duration)

  const closeDrawer = () => {
    setDrawer('streamerPromotionalMenu', false)
    setDrawer('streamerPromotional', true)
  }
  const getUrl = filename => {
    return new URL(`/src/assets/image/streamerPromotional/${filename}`, import.meta.url).href
  }

  const shareDrawer = () => {
    setDrawer('share', true)
    setDrawer('streamerPromotionalMenu', false)
  }

  const reportDrawer = () => {
    setDrawer('reportStreamer', true)
    setDrawer('streamerPromotionalMenu', false)
  }
</script>

<style lang="scss">
  .darkDrawer.streamer-promotional-menu.el-drawer {
    min-height: auto !important;
    border-radius: 15px;
    .el-drawer__body {
      padding: 0;

      .main-menu {
        padding: 12px 15px;
        background-color: #263045;
        .list {
          left: 0;

          > div {
            background-color: #38435c;
            padding: 8px 20px;
            margin: 5px 0;
            transition: background-color 0.2s ease;

            > img {
              width: 20px;
              height: 20px;
              margin-right: 10px;
            }
            &:hover {
              background-color: #5a6b8d;
            }
          }
          .report {
            color: #ff3f63;
          }
        }
      }
    }
  }
</style>
