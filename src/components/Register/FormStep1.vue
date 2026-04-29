<template>
  <div class="view-register-form-step-1" v-if="processData.typeStep === 1">
    <div>
      <div class="d-flex align-items-start">
        <div class="country-dial-code pb-2" style="width: 130px">
          <div class="label">{{ $t('國碼') }}</div>
          <el-select v-model="step1Form.twoLetterCountryCode" placeholder="Select">
            <el-option
              v-for="(item, index) in LANGUAGE_LIST"
              :key="index"
              :label="`+${item.countryCallingCode}`"
              :value="item.id.split('-')[1].toLowerCase()"
            />
          </el-select>
        </div>
        <div class="phone pb-2">
          <div class="label">{{ $t('電話號碼') }}</div>
          <vue-tel-input
            :class="{ validFalse: phoneErrorMsg }"
            v-model="step1Form.phoneInput"
            :key="step1Form.twoLetterCountryCode"
            :inputOptions="{ placeholder: '' }"
            :defaultCountry="step1Form.twoLetterCountryCode"
            @validate="actionValidate"
          />
          <small v-if="phoneErrorMsg" class="tips">{{ $t(phoneErrorMsg) }}</small>
        </div>
      </div>
      <div class="otp">
        <div class="label">{{ $t('驗證碼') }}</div>
        <el-input
          v-model="step1Form.otp"
          :placeholder="$t('六位數字驗證碼')"
          :class="{ validFalse: otpErrorMsg }"
          v-loading="isLoading"
          @input="otpErrorMsg = ''"
        >
          <template #append>
            <el-button :class="{ disabled: resendOTPSec > 0 }" @click="sendOTP">
              {{ resendOTPSec < 0 ? $t('發送驗證碼') : $t('重發驗證碼') }}
            </el-button>
          </template>
        </el-input>

        <small v-if="resendOTPSec > 0" class="resend-sec">{{ $t('{sec}秒後重發驗證碼', { sec: resendOTPSec }) + '...' }}</small>
        <small v-if="otpErrorMsg" class="tips">{{ $t(otpErrorMsg) }}</small>
      </div>
    </div>

    <div class="btn-group">
      <el-button class="back" round @click="btnBack">{{ $t('返回') }} </el-button>
      <el-button class="next" :class="{ hover: !processData.isRegister }" round @click="submitOTP" v-loading="isLoading">
        {{ processData.isRegister ? $t('下一步') : $t('登入') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, inject, watch, onUnmounted } from 'vue'
  import { postSendPhoneVerification, postCheckPhone, postCheckPhoneLogin, postResendVerification } from '@/api/verification.js'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  const defaultSettingStore = useDefaultSetting()
  const { locale, t } = useI18n()
  const isLoading = ref(false)
  const formData = inject('formData')
  const processData = inject('processData')
  const appInit = inject('appInit')
  const phoneErrorMsg = ref('')
  const otpErrorMsg = ref('')
  const resendOTPSec = ref(-1)

  const step1Form = ref({
    twoLetterCountryCode: locale.value.split('-')[1].toLowerCase(),
    phoneInput: '',
    otp: '',
    phoneValidate: '',
  })

  const sendOTP = async () => {
    if (resendOTPSec.value > 0 || isLoading.value) return
    phoneErrorMsg.value = Boolean(step1Form.value.phoneValidate) ? '' : '電話號碼格式不正確'
    if (phoneErrorMsg.value) return
    try {
      isLoading.value = true
      otpErrorMsg.value = ''
      const checkRes = await postCheckPhone({ phone: step1Form.value.phoneValidate }).then(res => res.data.data)

      // 判斷是否註冊過
      if (checkRes.isMember === processData.value.isRegister) {
        if (checkRes.isMember) phoneErrorMsg.value = '該電話號碼已經被註冊'
        else phoneErrorMsg.value = '該電話號碼尚未註冊'
        isLoading.value = false
        return
      }
      // 寄送簡訊 resendOTPSec初始值-1
      const res =
        resendOTPSec.value < 0
          ? await postSendPhoneVerification({ phone: step1Form.value.phoneValidate }).then(res => res.data)
          : await postResendVerification({ phone: step1Form.value.phoneValidate }).then(res => res.data)
      // 判斷是否成功發送簡訊
      if (!res) throw new Error('發生錯誤，請稍後再試')
      if (res.Status.Code !== '0') {
        if (res.Status.Code === '1006') otpErrorMsg.value = '未達重複發送間隔 60 秒，請稍後再試'
        else {
          phoneErrorMsg.value = '驗證碼發送失敗'
          throw new Error('驗證碼發送失敗')
        }
      } else {
        ElMessage({
          showClose: true,
          message: t('驗證碼已發送，請在 5 分鐘內輸入'),
          type: 'success',
          duration: 3000,
        })
      }
      isLoading.value = false
      // 開始倒數
      countdownResendSec()
    } catch (e) {
      console.warn(e)
      isLoading.value = false
      ElMessage({
        showClose: true,
        message: t(e.message),
        type: 'error',
        duration: 3000,
      })
    }
  }
  const secondInterval = ref(null)
  const countdownResendSec = () => {
    resendOTPSec.value = 61
    secondInterval.value = setInterval(() => {
      resendOTPSec.value--
      if (resendOTPSec.value === 0) clearInterval(secondInterval.value) // 停止計時器
    }, 1000)
  }

  const actionValidate = obj => {
    phoneErrorMsg.value = ''
    if (obj.valid) {
      step1Form.value.phoneValidate = obj.number
      step1Form.value.phoneInput = obj.formatted
    } else step1Form.value.phoneValidate = ''
  }

  const submitOTP = async () => {
    if (isLoading.value) return
    if (!step1Form.value.phoneValidate) phoneErrorMsg.value = '電話號碼格式不正確'
    if (!Boolean(/^\d{6}$/.test(step1Form.value.otp))) otpErrorMsg.value = '驗證碼格式不正確'
    if (phoneErrorMsg.value || otpErrorMsg.value) return
    const locationParams = new URLSearchParams(window.location.search)
    const locationParamsObject = Object.fromEntries(locationParams.entries())

    try {
      isLoading.value = true
      const input = {
        phone: step1Form.value.phoneValidate,
        verifyCode: step1Form.value.otp,
        isRegister: processData.value.isRegister,
        referralCode: locationParamsObject?.referralCode,
      }
      const checkRes = await postCheckPhoneLogin(input).then(res => res.data)
      if (checkRes.Status.Code !== '0' || !checkRes.data) {
        const ERROR_MSG = {
          1011: t('驗證碼輸入錯誤，您輸入的驗證碼為:') + input.verifyCode,
          1002: t('驗證碼超時或失效，請重新取得驗證碼'),
        }
        if (ERROR_MSG?.[checkRes.Status.Code]) otpErrorMsg.value = ERROR_MSG?.[checkRes.Status.Code]
        else throw new Error(t('登入失敗，請稍後再試。錯誤代碼：') + checkRes.Status.Code)
      } else {
        // 儲存資料
        localStorage.setItem('userToken', checkRes.data.access_token)
        formData.value.phone = input.phone

        // 判斷是否有填寫過登入資料isBasicDataEmpty
        if (!checkRes.isBasicDataEmpty && !processData.value.isRegister) {
          ElMessage({
            showClose: true,
            message: t('登入成功！'),
            type: 'success',
            duration: 3000,
          })
          defaultSettingStore.setRegisterVisible({ isVisible: false })
        } else processData.value.typeStep++
        appInit(checkRes.data.access_token)
      }
      isLoading.value = false
    } catch (e) {
      isLoading.value = false
      console.warn(e)
      ElMessage({
        showClose: true,
        message: e.message,
        type: 'error',
        duration: 3000,
      })
    }
  }
  const btnBack = () => {
    processData.value.step--
  }
  onUnmounted(() => {
    clearInterval(secondInterval.value)
  })
</script>
<style lang="scss" scoped>
  .el-select-dropdown__item {
    color: black !important;
    &:hover {
      background-color: #8094bb !important;
      color: white !important;
    }
  }
  .view-register-form-step-1 {
    flex-grow: 1;
    overflow-y: scroll;
    scrollbar-width: none;
    max-height: calc(100svh - 320px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 3px 10px 3px;

    .btn-group {
      display: flex;
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

    .vue-tel-input {
      border: 0;
      box-shadow: none;
      :deep(.vti__dropdown) {
        display: none;
      }
      :deep(input) {
        border: 1px solid #8094bb;
        border-radius: 30px;
        overflow: hidden;
        padding: 5px 15px;
        height: 40px;
        transition: 0.2s all ease;

        &:focus {
          box-shadow: inset 0 1px 2px #00000066;
        }
      }

      &.validFalse {
        :deep(input) {
          border: 1px solid var(--main-red);
        }
      }
    }
    .tips {
      color: var(--main-red);
    }

    .resend-sec {
      display: block;
      text-align: right;
      color: grey;
      padding: 2px 0;
    }

    .label {
      color: #8094bb;
      font-size: 12px;
      padding: 5px 0 5px 15px;
    }
    .country-dial-code {
      padding-right: 10px;
    }
    .phone {
      flex-grow: 1;
    }
    .el-select,
    .el-input {
      border: 1px solid #8094bb;
      border-radius: 30px;
      overflow: hidden;
      transition: 0.2s all ease;
      input {
        background-color: #405277;
      }

      &:focus {
        box-shadow: inset 0 1px 2px #00000066;
      }

      &.validFalse {
        border: 1px solid var(--main-red);
      }
    }
    :deep(.el-select),
    :deep(.el-input) {
      .el-select__wrapper,
      .el-input__wrapper {
        box-shadow: none;
        padding: 5px 15px;
        height: 40px;
        transition: 0.2s all ease;

        &.is-focus {
          box-shadow: inset 0px 1px 2px #00000066;
          border-radius: 40px 0 0 40px;
        }
      }

      .el-input-group__append {
        box-shadow: none;
        padding: 0;
        position: initial;

        button {
          background: linear-gradient(to right, #306aff, #f12889);
          color: #ffffff;
          height: 40px;
          width: 160px;

          &.disabled {
            background: #afafaf;
            cursor: no-drop;
          }
        }
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
