<template>
  <div class="view-system">
    <ViewHeader />
    <div class="container page-container">
      <section>
        <h2>{{ $t('設定') }}</h2>
        <div>{{ $t('顯示語言') }}</div>
        <el-select v-model="langValue" placeholder="Select" popper-class="popper-black-select" :suffix-icon="CaretBottom">
          <el-option v-for="lang in LANGUAGE_LIST" :key="lang.id" :label="lang.local" :value="lang.id" @click="setLocale">
            <div class="d-flex justify-content-between">
              <span>{{ lang.local }}</span>
              <i v-if="langValue === lang.id" class="bi bi-check fs-3"></i>
            </div>
          </el-option>
        </el-select>
      </section>
      <section>
        <h2>{{ $t('設定通知及服務') }}</h2>
        <div class="service-item" v-for="(item, index) in PAGE_TYPE" :key="index" @click="actionDialogVisible(item.id)">
          <span>{{ $t(item.title) }}</span>
          <span>{{ $t('查看') }}<i class="bi bi-chevron-right"></i></span>
        </div>
      </section>

      <div v-if="memberInfo?.account" class="logout" @click="btnLogout">{{ $t('登出') }}</div>
    </div>
    <!-- 隱私與服務條款 -->
    <el-dialog v-model="systemDialogVisible" align-center modal-class="view-system-dialog">
      <ViewLegalInformation :pageType="dialogContainType" />
    </el-dialog>
  </div>
</template>

<script setup>
  import { CaretBottom } from '@element-plus/icons-vue'
  import ViewHeader from '@/components/Header/index.vue'
  import ViewLegalInformation from '@/components/LegalInformation/index.vue'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { ref } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  const defaultSettingStore = useDefaultSetting()
  const { memberInfo } = storeToRefs(defaultSettingStore)
  const langValue = ref(localStorage.getItem('language'))
  const systemDialogVisible = ref(false)
  const dialogContainType = ref('PrivacyPolicy')

  const PAGE_TYPE = [
    { id: 'PrivacyPolicy', title: '隱私權政策' },
    { id: 'TermsOfService', title: '服務條款' },
    { id: 'UserGuidelines', title: '使用者規範' },
    { id: 'IntellectualProperty', title: '智慧財產權' },
  ]

  const btnLogout = () => {
    // 清除網址參數
    const newUrl = window.location.origin + window.location.pathname
    window.history.pushState({}, '', newUrl)
    // 刪除token並重新整理網頁
    localStorage.removeItem('userToken')
    location.reload()
  }
  const setLocale = () => {
    if (langValue.value === localStorage.getItem('language')) return
    defaultSettingStore.setLanguage(langValue.value)
  }

  const actionDialogVisible = type => {
    systemDialogVisible.value = true
    dialogContainType.value = type
  }
</script>
<style lang="scss" scoped>
  .view-system {
    color: white;
    .page-container {
      padding-top: 50px;
      padding-bottom: 100px;
      color: white;

      section {
        margin-bottom: 100px;

        h2 {
          padding: 20px 0;
        }

        :deep(.el-select) {
          padding: 15px 0;
          max-width: 250px;
          .el-select__wrapper {
            background-color: #f0ffff00;
            box-shadow: 0 0 0 1px #8094bb;
            padding: 0 20px;

            .el-select__placeholder {
              color: white;
            }
          }
        }

        .service-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          cursor: pointer;
          > span {
            &:last-child {
              color: #5a6b8d;
            }
          }
          &:hover,
          &:hover span:last-child {
            color: var(--main-red);
          }
        }
      }

      .logout {
        cursor: pointer;
        &:hover {
          color: var(--main-red);
        }
      }
    }

    @media (min-width: 768px) {
      .page-container {
        max-width: 768px;
      }
    }
    :deep(.view-system-dialog) {
      // background-color: aqua;
      .el-overlay-dialog {
        padding: 20px 10vw;
      }
      .el-dialog {
        background-color: #1f2530;
        color: white;
        padding: 30px;
        width: 100%;
        max-width: 800px;
      }
      @media (max-width: 450px) {
        .el-overlay-dialog {
          padding: 20px 15px;
        }
      }
    }
  }
</style>
