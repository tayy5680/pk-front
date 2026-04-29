<template>
  <div class="view-register-form-step-2" v-if="processData.typeStep === 2">
    <div class="form-main">
      <el-form
        ref="ruleFormRef"
        :model="step2Form"
        :rules="rules"
        label-width="auto"
        class="ruleForm"
        status-icon
        :size="'small'"
        :label-position="'top'"
      >
        <el-form-item :label="$t('帳號')" prop="account">
          <el-input v-model="step2Form.account" />
        </el-form-item>
        <el-form-item :label="$t('國家')" prop="country">
          <el-select v-model="step2Form.country" filterable :filter-method="countryFilterMethod">
            <el-option v-for="country in filteredOptions" :key="country.value" :label="country.label" :value="country.value">
              <img :src="country.flag" :alt="country.label" class="flag pe-2" width="30" />
              {{ country.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('暱稱')" prop="nickName">
          <el-input v-model="step2Form.nickName" :placeholder="$t('例如:櫻桃小丸子')" />
        </el-form-item>
        <el-form-item :label="$t('推薦人的邀請碼(選填)')">
          <el-input v-model="step2Form.referralCode" :controls="false" :placeholder="$t('可以空白，填寫後無法修改')" />
        </el-form-item>
      </el-form>
    </div>

    <div class="btn-group">
      <el-button class="back" round @click="btnLogout">{{ $t('取消並登出') }}</el-button>
      <el-button class="next" :class="{ hover: !processData.isRegister }" round @click="submitForm" v-loading="isLoading">
        {{ $t('下一步') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, inject, watch, onMounted, reactive } from 'vue'
  import { getCountryList } from '@/i18n/countries.js'
  import { postMemberBasicData } from '@/api/verification.js'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useRouter } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  const defaultSettingStore = useDefaultSetting()
  const { memberInfo } = storeToRefs(defaultSettingStore)
  const { locale, t } = useI18n()
  const isLoading = ref(false)
  const formData = inject('formData')
  const processData = inject('processData')
  const router = useRouter()

  const step2Form = ref({
    country: '',
    nickName: '',
    account: '',
    referralCode: '',
  })
  // 表單驗證
  const ruleFormRef = ref(null)
  const rules = reactive({
    country: [{ required: true, message: t('請選擇國家'), trigger: 'change' }],
    nickName: [
      { required: true, message: t('暱稱請勿空白'), trigger: 'change' },
      { min: 1, max: 20, message: t('暱稱不可超過20個字'), trigger: 'change' },
    ],
    account: [
      {
        required: true,
        validator: (rule, value, callback) => {
          ;/^[a-zA-Z0-9]+$/.test(value) || (value.length > 0 && value.length <= 20)
            ? callback()
            : callback(new Error(t('請輸入20字以內的英數字')))
        },
        trigger: 'blur',
      },
    ],
  })

  const submitForm = async () => {
    if (!ruleFormRef.value) return
    await ruleFormRef.value.validate((valid, fields) => {
      if (valid) submitNext()
    })
  }

  // 國家篩選區
  const countryList = ref([])
  const countrySearchKeyword = ref('')
  const countryFilterMethod = query => {
    countrySearchKeyword.value = query
  }
  const filteredOptions = computed(() => {
    if (!countrySearchKeyword.value) return countryList.value
    return countryList.value.filter(item => {
      return item.label.toLowerCase().includes(countrySearchKeyword.value.toLowerCase())
    })
  })

  const init = () => {
    countryList.value = getCountryList(locale.value)
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())
    step2Form.value = {
      country: '',
      nickName: defaultSettingStore.memberInfo?.memberName ?? '',
      account: defaultSettingStore.memberInfo?.account ?? '',
      referralCode: locationParamsObject?.referralCode ?? '',
    }
  }
  watch(memberInfo, () => {
    init()
  })
  onMounted(() => {
    init()
  })

  // 按鈕
  const submitNext = async () => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      const input = {
        country: step2Form.value.country.toUpperCase(),
        account: step2Form.value.account,
        name: step2Form.value.nickName,
        referralCode: step2Form.value.referralCode,
      }
      const res = await postMemberBasicData(input).then(res => res)

      if (res.Status.Code !== '0') {
        throw new Error(t('資料儲存異常。錯誤代碼：') + res.Status.Code)
      } else {
        // 儲存資料
        formData.value.account = input.account
        processData.value.typeStep++
      }

      isLoading.value = false
    } catch (e) {
      isLoading.value = false
      console.warn(e)
      ElMessage({
        showClose: true,
        message: e.message,
        type: 'error',
        duration: 0,
      })
    }
  }
  const btnLogout = () => {
    // 清除網址參數
    const newUrl = window.location.origin + window.location.pathname
    window.history.pushState({}, '', newUrl)

    // 刪除token並重新整理網頁
    localStorage.removeItem('userToken')
    location.reload()
  }
</script>
<style lang="scss" scoped>
  .view-register-form-step-2 {
    padding-top: 20px;
    flex-grow: 1;
    scrollbar-width: none;
    max-height: calc(100svh - 320px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .form-main {
      overflow-y: scroll;
      padding-bottom: 40px;

      :deep(.el-form) {
        .el-form-item__label {
          color: #8094bb;
          font-size: 12px;
          padding: 0px 15px;
        }
      }
    }

    .btn-group {
      position: sticky;
      width: 100%;
      display: flex;
      padding-top: 10px;

      button {
        flex-grow: 1;
        height: 40px;
        transition: 0.2s all ease;

        &.back {
          border: 1px solid #405277;
          background-color: white;
          color: #405277;
        }
        &.next {
          background: linear-gradient(to right, #5a6b8d, #5a6b8d);
          color: #3a4359;

          &.hover {
            background: linear-gradient(to right, #306aff, #f12889);
            color: #ffffff;
            border: 0;
          }

          &:hover {
            background: linear-gradient(to right, #306aff, #f12889);
            color: #ffffff;
            border: 0;
            box-shadow: 0px 2px 3px 0 #00000052;
          }
        }
      }
    }

    .el-select,
    .el-input {
      border: 1px solid #8094bb;
      border-radius: 30px;
      overflow: hidden;
      transition: 0.2s all ease;

      &:focus {
        box-shadow: inset 0 1px 2px #00000066;
      }

      &.validFalse {
        border: 1px solid var(--main-red);
      }
    }
    .el-form-item.is-error .el-input__wrapper:focus,
    .validFalse {
      border: 1px solid var(--main-red);
      box-shadow: none;
    }
    :deep(.el-select),
    :deep(.el-input) {
      .el-select__wrapper,
      .el-input__wrapper {
        box-shadow: none;
        padding: 5px 15px;
        height: 40px;
        transition: 0.2s all ease;
        border-radius: 40px;

        &.is-focus,
        &.is-focused {
          box-shadow: inset 0px 1px 2px #00000066 !important;
        }
      }

      .el-input-group__append {
        box-shadow: none;
        padding: 0;
        position: initial;
      }
    }
    :deep(.el-loading-spinner) {
      svg {
        scale: 0.6;
        circle {
          stroke: #3f51b5;
        }
      }
    }
  }
</style>
