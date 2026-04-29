<template>
  <div class="view-validate-phone-email">
    <div>
      <h5>{{ $t(validateType === 'phone' ? '電話號碼驗證' : '電子郵件驗證') }}</h5>
      <!-- 電話 -->
      <div v-if="validateType === 'phone'" class="input-temp-phone">
        <div class="title">{{ $t('電話號碼') }}</div>
        <div class="country-dial-code">
          <el-select v-model="validateForm.twoLetterCountryCode" placeholder="Select" popper-class="popper-black-select">
            <el-option
              v-for="(item, index) in LANGUAGE_LIST"
              :key="index"
              :label="`+${item.countryCallingCode}`"
              :value="item.id.split('-')[1].toLowerCase()"
            >
              <span class="text-light">{{ `+${item.countryCallingCode}` }}</span>
            </el-option>
          </el-select>
        </div>
        <div class="input-phone">
          <vue-tel-input
            :class="{ validFalse: inputErrorMsg }"
            v-model="validateForm.phoneInput"
            :key="validateForm.twoLetterCountryCode"
            :inputOptions="{ placeholder: '' }"
            :defaultCountry="validateForm.twoLetterCountryCode"
            @validate="actionValidate"
          />
        </div>
      </div>
      <!-- 信箱 -->
      <div v-if="validateType === 'email'" class="input-temp-email">
        <div class="title">{{ $t('電子郵件') }}</div>
        <div class="input-email w-100">
          <el-input v-model="validateForm.emailInput" :class="{ validFalse: inputErrorMsg }" @input="inputErrorMsg = ''" />
        </div>
      </div>

      <small v-if="inputErrorMsg" class="tips tips-1">{{ $t(inputErrorMsg) }}</small>
      <div class="form-input-otp pt-4">
        <div class="title">{{ $t('驗證碼') }}</div>
        <el-input
          v-model="validateForm.otp"
          :placeholder="$t('六位數字驗證碼')"
          :class="{ validFalse: otpErrorMsg }"
          v-loading="isLoading"
          @input="otpErrorMsg = ''"
        />
        <div v-if="resendOTPSec > 0" class="wait-text">{{ $t('{sec}秒後獲取', { sec: resendOTPSec }) }}</div>
        <el-button v-else :class="{ disabled: resendOTPSec > 0 }" @click="sendOTP">
          {{ resendOTPSec < 0 ? $t('發送驗證碼') : $t('重發驗證碼') }}
        </el-button>
      </div>
    </div>
    <small v-if="otpErrorMsg" class="tips tips-2">{{ $t(otpErrorMsg) }}</small>

    <div class="btn-group pt-5">
      <el-button class="opacity-red-btn" round @click="submitOTP" v-loading="isLoading">
        {{ $t('送出') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
  import { ref, onUnmounted, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { postMemberSendVerification, postMemberCheckVerification } from '@/api/member.js'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  const defaultSettingStore = useDefaultSetting()
  const { locale, t } = useI18n()
  const isLoading = ref(false)
  const inputErrorMsg = ref('')
  const otpErrorMsg = ref('')
  const resendOTPSec = ref(-1)
  const { memberInfo, isMobile } = storeToRefs(defaultSettingStore)

  const props = defineProps({
    validateType: {
      type: String,
      default: () => 'phone',
    },
    setValidateType: {
      type: Function,
    },
  })

  const validateForm = ref({
    twoLetterCountryCode: locale.value.split('-')[1].toLowerCase(),
    phoneInput: '',
    otp: '',
    phoneValidate: '',
    emailInput: '',
  })

  const sendOTP = async () => {
    if (resendOTPSec.value > 0 || isLoading.value) return
    if (props.validateType === 'phone')
      inputErrorMsg.value = Boolean(validateForm.value.phoneValidate) ? '' : '電話號碼格式不正確'
    if (props.validateType === 'email')
      inputErrorMsg.value = Boolean(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validateForm.value.emailInput)) ? '' : 'email格式不正確'
    if (inputErrorMsg.value) return

    try {
      isLoading.value = true
      otpErrorMsg.value = ''
      const input = {
        phone: props.validateType === 'phone' ? validateForm.value.phoneValidate : null,
        email: props.validateType === 'email' ? validateForm.value.emailInput : null,
      }
      const res = await postMemberSendVerification(input)
      const messages = {
        1032: t('驗證碼已發送，請在 5 分鐘內輸入'),
        1031: t('此{validateType}已被使用', { validateType: t(props.validateType === 'phone' ? '電話號碼' : '電子郵件') }),
        1006: t('驗證碼已發送，請在 5 分鐘內輸入'),
        0: t('驗證碼已發送，請在 5 分鐘內輸入'),
      }
      if (messages[res.Status.Code]) {
        ElMessage.success({
          showClose: true,
          message: messages[res.Status.Code],
          duration: 3000,
        })
      } else throw new Error(t('驗證碼發送失敗'))

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
    inputErrorMsg.value = ''
    if (obj.valid) {
      validateForm.value.phoneValidate = obj.number
      validateForm.value.phoneInput = obj.formatted
    } else validateForm.value.phoneValidate = ''
  }

  const submitOTP = async () => {
    if (isLoading.value) return
    if (props.validateType === 'phone' && !validateForm.value.phoneValidate) inputErrorMsg.value = '電話號碼格式不正確'
    if (props.validateType === 'email' && !Boolean(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(validateForm.value.emailInput)))
      inputErrorMsg.value = 'email格式不正確'
    if (!Boolean(/^\d{6}$/.test(validateForm.value.otp))) otpErrorMsg.value = '驗證碼格式不正確'
    if (inputErrorMsg.value || otpErrorMsg.value) return

    try {
      isLoading.value = true

      const input = {
        phone: props.validateType === 'phone' ? validateForm.value.phoneValidate : null,
        email: props.validateType === 'email' ? validateForm.value.emailInput : null,
        verifyCode: validateForm.value.otp,
      }
      const checkRes = await postMemberCheckVerification(input)
      if (checkRes.Status.Code !== '0') {
        const ERROR_MSG = {
          1011: t('驗證碼輸入錯誤，您輸入的驗證碼為:') + input.verifyCode,
          1002: t('驗證碼超時或失效，請重新取得驗證碼'),
          1004: t('手機已被註冊過'),
        }
        if (ERROR_MSG?.[checkRes.Status.Code]) otpErrorMsg.value = ERROR_MSG?.[checkRes.Status.Code]
        else throw new Error(t('登入失敗，請稍後再試。錯誤代碼：') + checkRes.Status.Code)
      } else {
        ElMessage.success({
          showClose: true,
          message: t('驗證成功！'),
          duration: 3000,
        })
        setValidateType('')
        await defaultSettingStore.reloadMemberInfo()
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

  onMounted(() => {
    validateForm.value = {
      twoLetterCountryCode: locale.value.split('-')[1].toLowerCase(),
      phoneInput: memberInfo.value.tempPhone,
      otp: '',
      phoneValidate: '',
      emailInput: memberInfo.value.tempEmail,
    }
  })

  onUnmounted(() => {
    clearInterval(secondInterval.value)
  })
</script>
<style lang="scss" scoped>
  .el-select-dropdown__item {
    color: white;
    padding: 0 10px !important;
  }
  .view-validate-phone-email {
    flex-grow: 1;
    overflow-y: scroll;
    scrollbar-width: none;
    max-height: calc(100svh - 320px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 3px 10px 3px;

    h5 {
      color: white;
      text-align: center;
      position: relative;
      top: -20px;
    }

    .input-temp-email,
    .input-temp-phone,
    .form-input-otp {
      display: flex;
      align-items: center;

      .title {
        color: white;
        flex-shrink: 0;
        width: 5em;
        font-weight: bold;
      }
      button {
        transition: 0.2s all ease;
        margin-left: 10px;
        background-color: #6a7a9d;
        color: white;
        border: 0;
        height: 36px;

        &:hover {
          background-color: #586788;
        }
      }

      .wait-text {
        color: #61739c;
        border: 1px solid #61739c;
        border-radius: 5px;
        cursor: not-allowed;
        height: 36px;
        white-space: nowrap;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding: 0 10px;
        margin-left: 10px;
      }
    }

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
        &.opacity-red-btn {
          border-radius: 5px;
          background-color: var(--main-red);
          &:hover {
            border-color: rgba(255, 255, 255, 0.479);
          }
        }
      }
    }

    .input-phone {
      flex-grow: 1;
      .vue-tel-input {
        border: 0;
        box-shadow: none;
        :deep(.vti__dropdown) {
          display: none;
        }
        :deep(input) {
          border: 1px solid #6b7a9d;
          border-radius: 5px;
          overflow: hidden;
          padding: 0px 10px;
          height: 36px;
          transition: 0.2s all ease;
          background-color: #00000000;
          color: white;
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
    }
    .tips {
      color: var(--main-red);

      &.tips-1 {
        text-align: right;
        display: block;
      }

      &.tips-2 {
        padding-left: 6em;
      }
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
      width: 100px;
    }

    :deep(.el-select) {
      .el-select__wrapper {
        background-color: #f0ffff00;
        box-shadow: 0 0 0 1px #6b7a9d;
        padding: 0 10px;
        height: 36px;

        .el-select__placeholder {
          color: white;
        }
      }
    }
    :deep(.el-input) {
      border-radius: 5px;
      .el-input__wrapper {
        background-color: #f0ffff00;
        box-shadow: 0 0 0 1px #6b7a9d;
        padding: 0 10px;
        height: 34px;
        font-size: 14px;
        input {
          color: white;
          font-size: 14px;
        }
      }

      &.validFalse {
        .el-input__wrapper {
          box-shadow: 0 0 0 1px var(--main-red);
        }
      }
    }
  }
</style>
