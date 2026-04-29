<template>
  <div class="view-register-form-step-3" v-if="processData.typeStep === 3">
    <div class="form-main" v-if="!isSubmitSuccess">
      <el-form
        ref="ruleFormRef"
        :model="step3Form"
        :rules="rules"
        label-width="auto"
        class="ruleForm"
        status-icon
        :size="'small'"
        :label-position="'top'"
      >
        <el-form-item :label="$t('全名')" prop="fullName">
          <el-input v-model="step3Form.fullName" :placeholder="$t('請輸入完整姓名')" />
        </el-form-item>
        <el-form-item :label="$t('生日')" prop="birthday">
          <div class="d-flex w-100">
            <el-select v-model="step3Form.birthday.yy" :placeholder="$t('年')" @change="updateDays">
              <el-option v-for="year in selectOptionYears" :key="year" :label="year" :value="year" />
            </el-select>
            <el-select v-model="step3Form.birthday.mm" :placeholder="$t('月')" @change="updateDays" class="mx-2">
              <el-option v-for="month in 12" :key="month" :label="month" :value="month" />
            </el-select>
            <el-select v-model="step3Form.birthday.dd" :placeholder="$t('日')">
              <el-option v-for="day in selectOptionDays" :key="day" :label="day" :value="day" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="E-mail" prop="email">
          <el-input v-model="step3Form.email" placeholder="user101@mail.com" />
        </el-form-item>
        <div class="d-flex w-100" v-if="!memberInfo?.phone">
          <el-form-item :label="$t('國碼')" prop="twoLetterCountryCode">
            <el-select v-model="step3Form.twoLetterCountryCode" placeholder="Select" class="me-1" style="width: 130px">
              <el-option
                v-for="(item, index) in LANGUAGE_LIST"
                :key="index"
                :label="`+${item.countryCallingCode}`"
                :value="item.id.split('-')[1].toLowerCase()"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('電話號碼')" prop="phoneInput" class="w-100">
            <vue-tel-input
              class="flex-grow-1"
              :class="{ validFalse: phoneErrorMsg }"
              v-model="step3Form.phoneInput"
              :key="step3Form.twoLetterCountryCode"
              :inputOptions="{ placeholder: '' }"
              :defaultCountry="step3Form.twoLetterCountryCode"
              @validate="actionValidate"
            />
          </el-form-item>
        </div>
        <div v-else>
          <el-form-item :label="$t('電話號碼')" class="w-100">
            <el-input v-model="step3Form.phoneInput" disabled />
          </el-form-item>
        </div>
        <el-form-item :label="$t('性別')" prop="gender">
          <el-select v-model="step3Form.gender" placeholder="Select">
            <el-option :label="$t('男')" :value="1" />
            <el-option :label="$t('女')" :value="2" />
            <el-option :label="$t('其他')" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('身分證號')" prop="identityId">
          <el-input v-model="step3Form.identityId" :placeholder="$t('請輸入身分證號')" />
        </el-form-item>
        <el-form-item :label="$t('身分證正面照')" prop="IdentityIdFrontArray">
          <div class="d-flex w-100">
            <div class="upload-tip" v-if="!step3Form.IdentityIdFrontArray.length">
              <span>{{ $t('請上傳照片') }}</span>
            </div>
            <el-upload
              class="upload-id-card"
              action="#"
              :file-list="step3Form.IdentityIdFrontArray"
              :on-remove="handleRemoveFront"
              :on-exceed="handleExceedFront"
              drag
              :accept="'.jpg,.jpeg,.png'"
              :limit="1"
              :before-upload="onPreviewFront"
            >
              <el-button type="primary">{{ $t('選擇檔案') }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item :label="$t('身分證背面照')" prop="IdentityIdBackArray">
          <div class="d-flex w-100">
            <div class="upload-tip" v-if="!step3Form.IdentityIdBackArray.length">
              <span>{{ $t('請上傳照片') }}</span>
            </div>
            <el-upload
              class="upload-id-card"
              action="#"
              :file-list="step3Form.IdentityIdBackArray"
              :on-remove="handleRemoveBack"
              :on-exceed="handleExceedBack"
              drag
              :accept="'.jpg,.jpeg,.png'"
              :limit="1"
              :before-upload="onPreviewBack"
            >
              <el-button type="primary">{{ $t('選擇檔案') }}</el-button>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <div class="form-main submit-success" v-else>
      <div><i class="bi bi-check2-circle"></i></div>
      <h5>資料審核中</h5>
      <small>已收到您的資料，請靜待通知結果，謝謝您。</small>
    </div>

    <div class="btn-group d-block" v-if="!isSubmitSuccess">
      <div class="btn-group">
        <el-button v-if="route.name !== 'Member'" class="back" round @click="btnPrevious">{{ $t('返回') }}</el-button>
        <el-button v-if="route.name === 'Member'" class="skip" round @click="btnSkip">{{ $t('取消') }}</el-button>
        <el-button class="next" :class="{ hover: !processData.isRegister }" round @click="submitForm" v-loading="isLoading">
          {{ route.name === 'Member' ? $t('前往驗證') : $t('完成') }}
        </el-button>
      </div>
      <el-button v-if="route.name !== 'Member'" class="skip w-100 mt-2" round @click="btnSkip">{{ $t('先略過') }}</el-button>
    </div>
    <div class="btn-group" v-else>
      <el-button class="skip" round @click="isSubmitSuccess = false">{{ $t('更改用戶資料') }}</el-button>
      <el-button class="next" :class="{ hover: !processData.isRegister }" round @click="btnSkip" v-loading="isLoading">
        {{ $t('完成') }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
  import dayjs from 'dayjs'
  import { ref, computed, inject, reactive, onMounted } from 'vue'
  import { getCountryList } from '@/i18n/countries.js'
  import { postMemberKYC } from '@/api/verification.js'
  import { postMemberPhoto } from '@/api/member.js'
  import { getMemberInfo } from '@/api/hall.js'
  import { useI18n } from 'vue-i18n'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { LANGUAGE_LIST } from '@/i18n/locales.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { useRoute } from 'vue-router'
  import { storeToRefs } from 'pinia'
  const defaultSettingStore = useDefaultSetting()
  const { memberInfo } = storeToRefs(defaultSettingStore)
  const { locale, t } = useI18n()
  const isLoading = ref(false)
  const formData = inject('formData')
  const processData = inject('processData')
  const phoneErrorMsg = ref('')
  const nameErrorMsg = ref('')
  const countryErrorMsg = ref('')
  const route = useRoute()
  // 是否成功送出表單過（送出過要鎖住身分證欄位）
  const isSubmitSuccess = ref(false)
  const submitSuccessFormRecord = ref({})

  const step3Form = ref({
    twoLetterCountryCode: locale.value.split('-')[1].toLowerCase(),
    phoneInput: '',
    phoneValidate: '',
    fullName: '',
    birthday: {
      yy: '',
      mm: '',
      dd: '',
    },
    email: '',
    gender: 1,
    identityId: '',
    IdentityIdFrontArray: [],
    IdentityIdFrontFile: null,
    IdentityIdBackArray: [],
    IdentityIdBackFile: null,
  })

  //  表單驗證
  const ruleFormRef = ref(null)
  const rules = reactive({
    email: [
      {
        required: true,
        validator: (_, value, callback) => {
          if (KYCErrorCode.value === '1031') return callback(new Error(t(KYC_ERROR_MESSAGE['1031'])))
          return callback(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : new Error(t('email格式不正確')))
        },
        trigger: 'change',
      },
    ],
    gender: [{ required: true, message: t('請選擇性別'), trigger: 'change' }],
    birthday: [
      {
        required: true,
        validator: (rule, value, callback) =>
          callback(!Object.values(value).includes('') ? undefined : new Error(t('請選擇完整生日'))),
        trigger: 'change',
      },
    ],
    fullName: [
      { required: true, message: t('全名請勿空白'), trigger: 'change' },
      { min: 1, max: 20, message: t('全名不可超過20個字'), trigger: 'change' },
    ],
    phoneInput: [
      {
        required: true,
        validator: (_, value, callback) => {
          if (KYCErrorCode.value === '1004') return callback(new Error(t(KYC_ERROR_MESSAGE['1004'])))
          return callback(step3Form.value.phoneValidate ? undefined : new Error(t('電話號碼格式不正確')))
        },
        trigger: 'change',
      },
    ],
    identityId: [
      {
        required: true,
        validator: (_, value, callback) => {
          if (!value.length) return callback(new Error(t('請填寫身分證號')))
          if (KYCErrorCode.value === '1035') return callback(new Error(t(KYC_ERROR_MESSAGE['1035'])))
          return callback()
        },
        trigger: 'change',
      },
    ],
    IdentityIdFrontArray: [
      {
        required: true,
        validator: (_, value, callback) => {
          if (KYCErrorCode.value === '520' && !KYCPhotoError.value.IdentityIdFront)
            return callback(new Error(t('上傳失敗，請檢查照片檔案')))
          return callback(value.length ? undefined : new Error(t('請上傳身分證正面照')))
        },
        trigger: 'change',
      },
    ],
    IdentityIdBackArray: [
      {
        required: true,
        validator: (_, value, callback) => {
          if (KYCErrorCode.value === '520' && !KYCPhotoError.value.IdentityIdBack)
            return callback(new Error(t('上傳失敗，請檢查照片檔案')))
          return callback(value.length ? undefined : new Error(t('請上傳身分證背面照')))
        },
        trigger: 'change',
      },
    ],
  })
  const submitForm = async () => {
    if (!ruleFormRef.value) return
    KYCErrorCode.value = 0
    KYCPhotoError.value = {
      IdentityIdBack: true,
      IdentityIdFront: true,
    }
    await ruleFormRef.value.validate((valid, fields) => {
      if (valid) submitNext()
    })
  }
  const parse520UploadResults = str => {
    const result = {}
    const regex = /UploadFile (\w+) returns (True|False)/g
    let match

    while ((match = regex.exec(str)) !== null) {
      result[match[1]] = match[2] === 'True'
    }

    return result
  }

  const KYCErrorCode = ref(0)
  const KYCPhotoError = ref({
    IdentityIdFront: true,
    IdentityIdBack: true,
  })
  const KYC_ERROR_MESSAGE = {
    1035: '身分證已被註冊過',
    1004: '手機已被註冊過',
    1031: 'Email已被註冊過',
    520: '身份證照片失敗',
  }
  const submitNext = async () => {
    if (isLoading.value) return
    try {
      isSubmitSuccess.value = false
      isLoading.value = true
      const formData = new FormData()
      formData.append('FullName', step3Form.value.fullName)
      const birthday = `${step3Form.value.birthday.yy}-${step3Form.value.birthday.mm}-${step3Form.value.birthday.dd}`
      formData.append('BirthDate', dayjs(birthday).format('YYYY-MM-DD'))
      formData.append('Email', step3Form.value.email)
      formData.append('Phone', step3Form.value.phoneValidate)
      formData.append('Gender', isSubmitSuccess.value ? null : step3Form.value.gender)
      const iid = submitSuccessFormRecord.value.identityId === step3Form.value.identityId ? null : step3Form.value.identityId
      formData.append('IdentityId', iid)
      formData.append('IdentityIdFront', step3Form.value.IdentityIdFrontFile)
      formData.append('IdentityIdBack', step3Form.value.IdentityIdBackFile)
      const res = await postMemberKYC(formData).then(res => res)

      if (res.Status.Code !== '0') {
        KYCErrorCode.value = res.Status.Code
        // 特殊狀況：520 圖片失敗=>判斷失敗的類型
        if (res.Status.Code === '520') KYCPhotoError.value = parse520UploadResults(res.Status.Message)
        ruleFormRef.value.validate()
        throw new Error(
          KYC_ERROR_MESSAGE?.[KYCErrorCode.value]
            ? t(KYC_ERROR_MESSAGE?.[KYCErrorCode.value])
            : t('資料儲存異常。錯誤代碼：') + res.Status.Code,
        )
      } else {
        // 提交成功
        isSubmitSuccess.value = true
        submitSuccessFormRecord.value = JSON.parse(JSON.stringify(step3Form.value))

        ElMessage({
          showClose: true,
          message: t('您的資料已成功提交，正在審核中，請耐心等候！'),
          type: 'success',
          duration: 0,
        })

        // btnSkip()
      }

      isLoading.value = false
    } catch (e) {
      isLoading.value = false
      console.warn(e)
      ElMessage.error({
        showClose: true,
        message: e.message,
      })
    }
  }
  const btnLogout = () => {
    // 回到登入或登出的介面
    processData.value.step = 2
    processData.value.typeStep = 1
  }
  const btnSkip = async () => {
    // 重新get Member Info
    await defaultSettingStore.reloadMemberInfo()
    defaultSettingStore.setRegisterVisible({ isVisible: false })
  }
  const btnPrevious = () => {
    processData.value.typeStep--
  }
  //電話號碼格式驗證
  const actionValidate = obj => {
    phoneErrorMsg.value = ''
    if (obj.valid) {
      step3Form.value.phoneValidate = obj.number
      step3Form.value.phoneInput = obj.formatted
    } else {
      step3Form.value.phoneValidate = ''
    }
    ruleFormRef.value.validateField('phoneInput')
  }

  // 生日的選項項目
  const selectOptionYears = Array.from({ length: 100 }, (_, i) => dayjs().year() - 100 + i).reverse()
  const selectOptionDays = ref([])
  function updateDays() {
    const { yy, mm } = step3Form.value.birthday
    if (yy && mm) {
      const daysInMonth = dayjs(`${yy}-${mm}-01`).daysInMonth()
      selectOptionDays.value = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    } else {
      selectOptionDays.value = []
    }
  }

  // 正面照Upload設定
  const handleRemoveFront = () => {
    step3Form.value.IdentityIdFrontArray = []
    step3Form.value.IdentityIdFrontFile = null
  }
  const handleExceedFront = ([file]) => onPreviewFront(file)
  const onPreviewFront = rawFile => {
    ruleFormRef.value?.clearValidate('IdentityIdFrontArray')
    const reader = new FileReader()
    reader.onload = e => {
      step3Form.value.IdentityIdFrontArray[0] = rawFile

      if (e.target.result) {
        fetch(e.target.result)
          .then(res => res.blob())
          .then(async blob => {
            const file = new File([blob], rawFile.name)
            step3Form.value.IdentityIdFrontFile = file
          })
      }
    }
    reader.readAsDataURL(rawFile)
    return false
  }
  // 背面照Upload設定
  const handleRemoveBack = () => {
    step3Form.value.IdentityIdBackArray = []
    step3Form.value.IdentityIdBackFile = null
  }
  const handleExceedBack = ([file]) => onPreviewBack(file)
  const onPreviewBack = rawFile => {
    ruleFormRef.value?.clearValidate('IdentityIdBackArray')
    const reader = new FileReader()
    reader.onload = e => {
      step3Form.value.IdentityIdBackArray[0] = rawFile

      if (e.target.result) {
        fetch(e.target.result)
          .then(res => res.blob())
          .then(async blob => {
            const file = new File([blob], rawFile.name)
            step3Form.value.IdentityIdBackFile = file
          })
      }
    }
    reader.readAsDataURL(rawFile)
    return false
  }

  onMounted(async () => {
    if (!memberInfo.value?.memberId) {
      isLoading.value = true
      await defaultSettingStore.reloadMemberInfo().catch(e => {
        isLoading.value = false
      })
      isLoading.value = false
    }
    step3Form.value = {
      ...step3Form.value,
      phoneInput: memberInfo.value?.phone ?? '',
      phoneValidate: memberInfo.value?.phone ?? '',
      email: memberInfo.value?.email ?? '',
    }
  })
</script>
<style lang="scss" scoped>
  .view-register-form-step-3 {
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
        .el-form-item {
          .el-form-item__label {
            color: #8094bb;
            font-size: 12px;
            padding: 0px 15px;
          }

          &.is-error {
            .el-select {
              border: 1px solid var(--main-red);
              .el-select__wrapper {
                box-shadow: none !important;
              }
            }
            .el-input,
            .el-upload-list,
            .vue-tel-input input {
              border: 1px solid var(--main-red);
              .el-input__wrapper {
                box-shadow: none !important;
              }
            }
          }
        }

        :deep(.el-input) {
          .el-input__wrapper:focus {
            border: 1px solid var(--main-red);
            box-shadow: none;
          }
        }
        :deep(.el-select) {
          color: red;
          .el-select__wrapper:focus {
            border: 1px solid var(--main-red);
            box-shadow: none;
          }
        }
      }

      &.submit-success {
        color: #8a9ecc;
        flex-grow: 1;
        padding: 0;
        overflow: hidden;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding-bottom: 30px;
        > div {
          font-size: 100px;
          line-height: 110px;
        }
        > h5 {
        }
        > small {
          color: #6a7a9d;
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
        width: 50%;

        &.back {
          border: 1px solid #405277;
          background-color: white;
          color: #405277;
        }
        &.skip {
          background: black;
          color: white;

          &:hover {
            box-shadow: 0 3px 5px rgb(0 0 0 / 21%);
          }
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

    .country-dial-code {
      padding-right: 10px;
    }
    .phone {
      flex-grow: 1;
    }

    :deep(.el-loading-spinner) {
      svg {
        scale: 0.6;
        circle {
          stroke: #3f51b5;
        }
      }
    }

    .upload-id-card {
      display: flex;
      align-items: center;
      flex-direction: row-reverse;
      width: 100%;
      :deep(.el-upload) {
        .el-upload-dragger {
          padding: 0;
          border: 0;

          button {
            height: 40px;
            border-radius: 40px;
            background-color: #3a4359;
            border: 0;
            padding: 0 25px;
            color: white;

            &:hover {
              background-color: #8094bb;
            }
          }
        }
      }
      :deep(.el-upload-list) {
        margin: 0 15px 0 0;
        flex-grow: 1;
        border: 1px solid #8094bb;
        border-radius: 30px;
        overflow: hidden;
        height: 40px;

        .el-upload-list__item {
          height: 40px;
          display: flex;
          align-items: center;
          .el-icon--close {
            right: 10px;
          }
        }
      }
      .el-upload__tip {
        color: var(--main-red);
      }
    }
    .upload-tip {
      color: rgb(90, 107, 141);
      position: relative;
      line-height: 40px;
      height: 0px;
      width: 0;
      padding: 0;
      white-space: nowrap;

      span {
        padding: 0 20px;
      }
    }
    .label {
      color: #8094bb;
      font-size: 12px;
      padding: 5px 15px;
    }
    .country-dial-code {
      padding-right: 10px;
    }
    .phone {
      flex-grow: 1;
    }
    .el-select,
    .el-input-number,
    .el-input {
      border: 1px solid #8094bb;
      border-radius: 30px;
      overflow: hidden;
      transition: 0.2s all ease;

      &:focus {
        box-shadow: inset 0 1px 2px #00000066;
      }
    }
    :deep(.el-select),
    :deep(.el-input-number),
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

        button {
          background: linear-gradient(to right, #306aff, #f12889);
          color: #ffffff;
          height: 40px;
          width: 160px;
        }
      }

      .el-select__wrapper:focus {
        box-shadow: none;
      }
    }

    :deep(.el-input-number .el-input__inner) {
      text-align: left;
      color: #8094bb;
    }
  }
</style>
