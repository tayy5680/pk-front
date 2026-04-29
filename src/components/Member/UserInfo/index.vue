<template>
  <div class="view-user-info">
    <div @click="isUserInfoVisible = true">{{ $t('基本資料') }}</div>
    <!-- <div @click="actionKYC">
      <span>{{ $t('實名驗證') }}</span>
      <span :class="`kyc${memberInfo?.kycStatus}`">{{ $t(KYC_STATUS[memberInfo?.kycStatus ?? 0]) }}</span>
    </div> -->
    <!-- <div @click="actionKYC">
      <span>{{ $t('收款帳戶資料') }}</span>
      <span>{{ $t(KYC_STATUS[memberInfo?.BankAccountStatus ?? 0]) }}</span>
    </div> -->
    <div :class="{ 'referral-used': memberInfo?.up_ReferralCode }" @click="showBindReferralCode">
      <span>{{ $t('推薦碼') }}</span>
      <span>{{ memberInfo?.up_ReferralCode ?? $t('無推薦碼') }}</span>
    </div>
    <el-dialog v-model="isUserInfoVisible" align-center modal-class="view-dark-dialog">
      <ViewUserInfoDialog v-if="!validateType" :setValidateType="setValidateType" />
      <ViewValidatePhoneEmailDialog v-else :validateType="validateType" :setValidateType="setValidateType" />
    </el-dialog>
    <el-dialog v-model="isBindReferralCodeVisible" modal-class="view-dark-dialog referral-code">
      <h5>{{ $t('推薦碼') }}</h5>
      <label>{{ $t('推薦碼 (填寫後不可更改)') }}</label>
      <el-input v-model="referralCode" :placeholder="$t('請輸入推薦人號碼')" />
      <small v-if="referralCodeErrorMsg">{{ $t(referralCodeErrorMsg) }}</small>
      <el-button @click="submitReferralCode">{{ $t('確認') }}</el-button>
    </el-dialog>
  </div>
</template>
<script setup>
  import ViewUserInfoDialog from './indexDialog.vue'
  import ViewValidatePhoneEmailDialog from './validatePhoneEmailDialog.vue'
  import { ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { postBindReferralCode } from '@/api/member.js'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { storeToRefs } from 'pinia'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const defaultSettingStore = useDefaultSetting()
  const { memberInfo } = storeToRefs(defaultSettingStore)

  // 推薦碼
  const isBindReferralCodeVisible = ref(false)
  const referralCode = ref('')
  const referralCodeErrorMsg = ref('')
  const submitReferralCode = async () => {
    referralCodeErrorMsg.value = ''
    if (!referralCode.value) return (referralCodeErrorMsg.value = '請輸入推薦人號碼')
    if (referralCode.value === memberInfo.value?.referralCode) return (referralCodeErrorMsg.value = '請勿輸入自己的推薦碼')
    try {
      const res = await postBindReferralCode({ referralCode: referralCode.value })
      if (res.Status.Code !== '0') {
        referralCodeErrorMsg.value = res.Status.Message
      } else {
        ElMessage.success(t('推薦碼輸入成功'))
        await defaultSettingStore.reloadMemberInfo()
        isBindReferralCodeVisible.value = false
      }
    } catch (e) {
      console.warn(e)
      referralCodeErrorMsg.value = '推薦碼輸入錯誤'
    }
  }
  const showBindReferralCode = () => {
    if (memberInfo.value.up_ReferralCode) return
    isBindReferralCodeVisible.value = true
    referralCode.value = ''
    referralCodeErrorMsg.value = ''
  }

  const KYC_STATUS = {
    0: '尚未驗證',
    1: '審核中',
    2: '已通過',
    3: '未通過',
  }
  const actionKYC = () => {
    if (memberInfo.value.kycStatus !== 0) return
    defaultSettingStore.setRegisterVisible({ isVisible: true })
  }

  const isUserInfoVisible = ref(false)
  const actionUserInfoVisible = bool => {
    isUserInfoVisible.value = bool
  }
  watch(isUserInfoVisible, val => {
    validateType.value = ''
  })

  const validateType = ref('')
  const setValidateType = type => {
    validateType.value = type
  }
</script>
<style lang="scss" scoped>
  .view-user-info {
    > div {
      border-radius: 5px;
      padding: 15px 20px;
      margin-bottom: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      &:hover {
        background-color: #242a37;
      }
      > span {
        &:last-child {
          color: #8094bb;
        }
      }
    }
    .referral-used {
      cursor: default;
      > span:last-child {
        color: #e72b8e;
      }
      &:hover {
        background-color: #242a3700;
      }
    }
    .kyc2 {
      color: #b6ff7e !important;
    }
    :deep(.view-dark-dialog) {
      // background-color: aqua;
      color: white;
      .el-overlay-dialog {
        padding: 20px 10vw;
      }
      @media (max-width: 450px) {
        .el-overlay-dialog {
          padding: 20px 15px;
        }
      }
      .el-dialog {
        border-radius: 10px;
        background-color: #293550;
        color: white;
        padding: 30px;
        max-width: 450px;
        width: 70vw;

        .el-dialog__header {
          padding: 0;
        }
      }

      @media (max-width: 450px) {
        .el-dialog {
          width: 100% !important;
        }
      }

      h5 {
        color: white;
        text-align: center;
      }

      &.referral-code {
        label {
          color: white;
          font-weight: bold;
          padding: 10px 0;
        }
        small {
          color: var(--main-red);
          padding-top: 5px;
          display: block;
        }
        .el-input {
          display: block;

          .el-input__inner {
            color: white;
          }

          .el-input__wrapper {
            height: 40px;
            width: 100%;
            background-color: #293550;
            box-shadow: 0 0 0 0;
            border: 1px solid #6a7a9d;
            border-radius: 5px;
            color: white;
          }
        }
        .el-button {
          transition: 0.2s all ease;
          height: 40px;
          width: 100%;
          margin-top: 30px;
          background-color: var(--main-red);
          color: white;
          border-color: var(--main-red);
          &:hover {
            border-color: white;
          }
        }
      }
    }
  }
  :deep(.el-loading-mask) {
    background-color: #00000085;
    .el-loading-spinner {
      svg {
        scale: 0.6;
        circle {
          stroke: #ffffff;
        }
      }
    }
  }
</style>
