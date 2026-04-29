<template>
  <div>
    <el-drawer
      class="darkDrawer"
      v-model="drawerList.mainList"
      direction="btt"
      :before-close="closeDrawer"
      :show-close="false"
      :with-header="false"
      :size="'60%'"
      :style="`min-height: ${40 + 50 * (mainList.length > 5 ? 5 : mainList.length)}px`"
    >
      <div class="main-menu">
        <!-- 主選單 -->
        <div class="list" :class="{ hidding: showSubMenu }">
          <div @click="active('betlog')" class="list-item">
            <img :src="getUrl('icon_Hreflang.svg')" width="24" height="24" class="icon" />
            <div class="flex-grow-1">{{ $t('遊玩紀錄') }}</div>
            <i class="bi bi-chevron-right me-0"></i>
          </div>
          <div class="list-group">
            <div @click="active('share')" class="list-item">
              <img :src="getUrl('i_share.png')" width="24" height="24" class="icon" />
              <div class="flex-grow-1">{{ $t('分享連結') }}</div>
            </div>
            <div class="list-item no-hover">
              <img
                :src="getUrl(isDanmakuVisible ? 'i_chatroomoff.png' : 'i_chatroomon.png')"
                width="24"
                height="24"
                class="icon"
              />
              <div class="flex-grow-1">{{ $t(isDanmakuVisible ? '關閉聊天室' : '開啟聊天室') }}</div>
              <el-switch :model-value="isDanmakuVisible" @change="active(isDanmakuVisible ? 'closeDanmu' : 'openDanmu')" />
            </div>
          </div>
          <div @click="active('report')" class="list-item">
            <img :src="getUrl('i_report.png')" width="24" height="24" class="icon" />
            <div class="flex-grow-1">{{ $t('檢舉直播') }}</div>
          </div>
          <div @click="active('language')" class="list-item">
            <i class="bi bi-globe"></i>
            <div class="flex-grow-1">{{ $t('語系設定') }}</div>
            <i class="bi bi-chevron-right me-0"></i>
          </div>
          <div @click="active('back')" class="list-item">
            <i class="bi bi-house-door-fill"></i>
            <div class="flex-grow-1">{{ $t('返回大廳') }}</div>
          </div>
        </div>
        <!-- 次選單 -->
        <div class="sub-list" :class="{ show: showSubMenu }">
          <ViewMenuLanguage v-if="subMenuId === 'language'" :close="clearSubMenuValue" />
          <ViewMenuBetlog v-if="subMenuId === 'betlog'" :close="clearSubMenuValue" />
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
  import { ref, computed, watch, inject, provide } from 'vue'
  import ViewMenuBetlog from './Betlog.vue'
  import ViewShareDrawer from './ShareList.vue'
  import ViewMenuLanguage from './Language.vue'
  import { useChat, useStream } from '@/store/live.js'
  import { storeToRefs } from 'pinia'
  import { ElMessage } from 'element-plus'
  import { useRouter } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useI18n } from 'vue-i18n'
  const { t, locale } = useI18n()
  const router = useRouter()
  const chatStore = useChat()
  const streamStore = useStream()
  const defaultSettingStore = useDefaultSetting()
  const { isDanmakuVisible } = storeToRefs(chatStore)
  const { isFinishStream } = storeToRefs(streamStore)
  const drawerList = inject('drawerList')
  const setDrawer = inject('setDrawer')

  const isLanguageDiaglog = ref(false)

  const closeDrawer = () => {
    setDrawer('mainList', false)
    isLanguageDiaglog.value = false
  }

  const mainList = computed(() => {
    let list = [
      { id: 'betlog', label: '遊玩紀錄', imgUrl: 'icon_Hreflang.svg', isActive: true, subMenu: true },
      { id: 'share', label: '分享', imgUrl: 'i_share.png', isActive: true, subMenu: false },
      {
        id: 'closeDanmu',
        label: '關閉留言區',
        imgUrl: 'i_chatroomoff.png',
        subMenu: false,
        isActive: isDanmakuVisible.value && !isFinishStream.value,
      },
      {
        id: 'openDanmu',
        label: '開啟留言區',
        imgUrl: 'i_chatroomon.png',
        subMenu: false,
        isActive: !isDanmakuVisible.value && !isFinishStream.value,
      },
      { id: 'language', label: '語系設定', icon: 'bi-globe', isActive: true, subMenu: true },
      { id: 'back', label: '返回大廳', icon: 'bi-house-door-fill', isActive: true, subMenu: false },
    ]
    return list.filter(item => item.isActive)
  })

  const getUrl = filename => {
    return new URL(`/src/assets/image/menu/${filename}`, import.meta.url).href
  }

  const active = itemID => {
    switch (itemID) {
      case 'closeDanmu':
        chatStore.setDanmaku(false)
        break
      case 'openDanmu':
        chatStore.setDanmaku(true)
        break
      case 'back':
        try {
          let url = new URL(window.location.href)
          let params = url.searchParams
          params.delete('streamchannelid')
          params.delete('streamerid')
          // 移除紀錄的頻道ID
          sessionStorage.removeItem('streamChannelId')
          router.push(`/?${params.toString()}`)
        } catch (e) {
          console.warn(e)
          router.push(`/?${params.toString()}`)
        }
        break
      case 'betlog':
        showSubMenu.value = true
        subMenuId.value = 'betlog'
        break
      case 'language':
        showSubMenu.value = true
        subMenuId.value = 'language'
        break
      case 'share':
        closeDrawer()
        setDrawer('all', false)
        setDrawer('share', true)
        break

      case 'report':
        closeDrawer()
        setDrawer('all', false)
        setDrawer('reportStreamer', true)
        break
    }
  }

  const showSubMenu = ref(false)
  const subMenuId = ref('')
  const isMainListVisible = computed(() => drawerList.value.mainList)
  watch(isMainListVisible, val => {
    if (val) clearSubMenuValue()
  })
  const clearSubMenuValue = () => {
    showSubMenu.value = false
    subMenuId.value = ''
  }
</script>

<style lang="scss" scoped>
  :deep(.language-dialog) {
    background-color: var(--border-color);
    border-radius: 10px;

    header span,
    header i,
    div {
      color: white;
    }

    .el-dialog__body {
      > div {
        transition: 0.2s all ease;
        cursor: pointer;
        border-radius: 10px;
        padding: 10px 15px;
        text-align: center;
        margin-top: 12px;
        background-color: rgb(255 255 255 / 14%);

        &:hover {
          background-color: var(--main-red);
        }
      }
      > div:first-child {
        margin-top: 0px;
      }
    }
  }
  .main-menu {
    .list {
      left: 0;

      &.hidding {
        left: calc(-100% - 15px);
      }

      .list-group {
        padding: 0;
        display: flex;
        cursor: pointer;
        background-color: #38435c;
        margin: 5px 0;
        transition: background-color 0.2s ease;
        border-radius: 10px;

        .list-item {
          margin: 0 !important;
          border-bottom: 1px solid #405277;
          border-radius: 0 !important;

          &:first-child {
            border-radius: 10px 10px 0 0 !important;
          }

          &:last-child {
            border-bottom: 0;
            border-radius: 0 0 10px 10px !important;
          }
          &.no-hover {
            cursor: default;
            &:hover {
              background-color: inherit;
            }
          }
        }
      }
      .el-switch {
        --el-switch-on-color: #9b47ff;
        --el-switch-off-color: #5a6b8d;
        height: 23px;
      }
    }

    .sub-list {
      transition: 0.2s all ease;
      right: -100%;
      position: absolute;
      overflow-y: scroll;
      scrollbar-width: none;
      width: 100%;
      flex-grow: 1;
      height: 100%;
      margin-top: -12px;

      &.show {
        right: 0;
      }

      button {
        padding: 0px 20px;
        background: none;
        color: darkgray;
      }
    }
  }
</style>
