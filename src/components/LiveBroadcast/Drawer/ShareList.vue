<template>
  <el-drawer
    class="darkDrawer share"
    v-model="drawerList.share"
    direction="btt"
    :before-close="closeDrawer"
    :show-close="false"
    :with-header="false"
    :size="'auto'"
    style="min-height: auto"
  >
    <div class="main-menu">
      <div class="title">{{ $t('分享到') }}</div>
      <div class="share-list">
        <div v-for="(item, index) in SHARE_LIST" :key="index" class="share-items" @click="copyShareLink(item)">
          <i :class="`bi ${item.icon}`"></i>
          <div>{{ $t(item.label) }}</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
  import { inject } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')
  const defaultSettingStore = useDefaultSetting()

  const SHARE_LIST = [
    { id: 'Default', label: '複製連結', icon: 'bi-link-45deg' },
    // { id: 'Instagram', label: 'Instagram', icon: 'bi-instagram' },
    { id: 'Facebook', label: 'Facebook', icon: 'bi-facebook' },
    { id: 'X', label: 'X', icon: 'bi-twitter-x' },
    { id: 'Line', label: 'Line', icon: 'bi-line' },
    // { id: 'Messenger', label: 'Messenger', icon: 'bi-messenger' },
    { id: 'WhatsApp', label: 'WhatsApp', icon: 'bi-whatsapp' },
    // { id: 'Wechat', label: 'Wechat', icon: 'bi-wechat' },
    // { id: 'More', label: '更多', icon: 'bi-three-dots' },
  ]

  const closeDrawer = () => {
    setDrawer('share', false)
  }

  const copyShareLink = item => {
    const { origin, pathname } = window.location
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())

    const url = `${origin + pathname}?streamchannelid=${locationParamsObject.streamchannelid}&streamerid=${locationParamsObject.streamerid}`
    const shareText = ''
    let shareUrl = ''

    switch (item.id) {
      case 'Facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
      case 'X':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`
        break
      case 'Line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`
        break
      case 'Messenger':
        // 使用 m.me 方式，不需 App ID，但只支援分享到聊天對象
        // 更好方式仍需 App ID
        shareUrl = `fb-messenger://share/?link=${encodeURIComponent(url)}`
        break
      case 'WhatsApp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}%20${encodeURIComponent(url)}`
        break

      default:
        navigator.clipboard
          .writeText(url)
          .then(() => {
            ElMessage.success({ showClose: true, message: t('複製成功') })
          })
          .catch(() => {
            ElMessage.error({ showClose: true, message: t('複製失敗') })
          })
        break
    }
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400')
    }
  }
</script>

<style lang="scss" scoped>
  .main-menu {
    .title {
      padding: 0 0px;
    }
    .share-list {
      padding: 0 10px;
      display: flex;
      overflow-x: scroll;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE 10+ */

      .share-items {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        padding: 10px;
        > i {
          width: 55px;
          height: 55px;
          background-color: #5a6b8d;
          display: block;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: 0.2s all ease;
          font-size: 24px;
        }
        > div {
          font-size: 12px;
          white-space: nowrap;
        }

        &:hover {
          > i {
            background-color: #8094bb;
          }
        }
      }
    }
  }
</style>
