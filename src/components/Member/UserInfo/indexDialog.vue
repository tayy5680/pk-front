<template>
  <div class="view-user-info-dialog" v-loading="isLoading">
    <h5>{{ $t('基本資料') }}</h5>
    <div class="main-scroll">
      <div class="avatar-area" :class="{ edit: isEditMode }">
        <el-avatar :size="80" fit="cover" :src="isEditMode ? editPhoto.preview ?? memberInfo?.photoPath : memberInfo?.photoPath">
          <img :src="userPhoto" />
        </el-avatar>
        <img class="avatar-frame" :src="memberInfo?.photo?.frame" v-if="memberInfo?.photo?.frame" />
        <el-upload
          v-loading="isLoading"
          v-if="isEditMode"
          class="upload-avatar"
          action="#"
          drag
          :accept="'.jpg,.jpeg,.png'"
          :limit="1"
          :before-upload="onPreview"
        >
          <div class="upload-icon"><i class="bi bi-camera"></i></div>
        </el-upload>
      </div>
      <el-form
        ref="ruleFormRecf"
        :model="infoForm"
        :rules="rules"
        class="user-info-form"
        :class="{ edit: isEditMode }"
        :label-position="isEditMode || isMobile ? 'top' : 'left'"
      >
        <el-form-item :label="$t('玩家暱稱')" prop="nickName">
          <p v-if="!isEditMode">{{ memberInfo?.memberName }}</p>
          <el-input v-else v-model="infoForm.nickName" :placeholder="$t('請輸入暱稱')" />
        </el-form-item>
        <el-form-item label="ID">
          <p>{{ memberInfo?.account }}</p>
        </el-form-item>
        <el-form-item :label="$t('地區')">
          <p>{{ memberInfo?.country || '-' }}</p>
        </el-form-item>
        <el-form-item prop="tempPhone">
          <template #label>
            {{ $t('電話號碼') }}
            <div v-if="isMobile && isBtnValidatePhoneVisible" class="top-btn ps-2" @click="setValidateType('phone')">
              {{ $t('尚未驗證') }} <i class="bi bi-chevron-right"></i>
            </div>
          </template>
          <el-input v-if="isEditMode && !memberInfo.phone" v-model="infoForm.tempPhone" />
          <div v-else class="phone">
            <div>{{ memberInfo?.phone || memberInfo?.tempPhone || '-' }}</div>
            <div v-if="!isMobile && isBtnValidatePhoneVisible" class="v-btn ps-2" @click="setValidateType('phone')">
              {{ $t('尚未驗證') }}
            </div>
          </div>
        </el-form-item>

        <el-form-item prop="tempEmail">
          <template #label>
            {{ $t('電子郵件') }}
            <div v-if="isMobile && isBtnValidateEmailVisible" class="top-btn ps-2" @click="setValidateType('email')">
              {{ $t('尚未驗證') }} <i class="bi bi-chevron-right"></i>
            </div>
          </template>
          <el-input v-if="isEditMode && !memberInfo.email" v-model="infoForm.tempEmail" />
          <div v-else class="email">
            <div>{{ memberInfo?.email || memberInfo?.tempEmail || '-' }}</div>
            <div v-if="!isMobile && isBtnValidateEmailVisible" class="v-btn ps-2" @click="setValidateType('email')">
              {{ $t('尚未驗證') }}
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <div class="form-btn d-flex" v-if="isEditMode">
      <el-button class="cancel" @click="setEditMode(false)">{{ $t('取消') }} </el-button>
      <el-button class="submit" @click="submitForm">{{ $t('儲存') }}</el-button>
    </div>
    <div class="form-btn" v-else>
      <el-button class="edit" @click="setEditMode(true)">{{ $t('編輯') }}</el-button>
    </div>
  </div>
</template>
<script setup>
  import dayjs from 'dayjs'
  import ViewInfo from '@/assets/image/default/user.jpeg'
  import { ref, computed, watch, inject, reactive } from 'vue'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  import { postMemberNickName, postMemberPhoto } from '@/api/member.js'
  import { postMemberBasicData } from '@/api/verification.js'
  import { getMemberInfo } from '@/api/hall.js'
  import { storeToRefs } from 'pinia'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  const defaultSettingStore = useDefaultSetting()
  const { memberInfo, isMobile } = storeToRefs(defaultSettingStore)
  const activeTabName = inject('activeTabName')
  const isLoading = inject('isLoading')
  // 是否顯示驗證按鈕
  const isBtnValidatePhoneVisible = computed(() => !isEditMode.value && memberInfo.value?.tempPhone && !memberInfo.value?.phone)
  const isBtnValidateEmailVisible = computed(() => !isEditMode.value && memberInfo.value?.tempEmail && !memberInfo.value?.email)

  const props = defineProps({
    setValidateType: {
      type: Function,
    },
  })
  /**
   * memberInfo規則說明：
   * email、phone:已驗證過的資料，不允許編輯。
   * tempEmail、tempPhone：未驗證的資料，可編輯、可驗證。
   */

  // 切換編輯模式
  const isEditMode = ref(false)
  const setEditMode = bool => {
    isEditMode.value = bool
  }
  watch(isEditMode, val => {
    if (val) {
      editPhoto.value = {
        preview: null,
        file: null,
      }
      infoForm.value = {
        nickName: memberInfo.value?.memberName,
        tempEmail: memberInfo.value?.tempEmail ?? '',
        tempPhone: memberInfo.value?.tempPhone ?? '',
      }
    } else {
      ruleFormRecf.value?.clearValidate()
    }
  })
  // 照片資料相關
  const editPhoto = ref({
    preview: null,
    file: null,
  })
  const onPreview = rawFile => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (rawFile.size > maxSize) return ElMessage.error(t('圖片大小不能超過 5MB'))

    const reader = new FileReader()
    isLoading.value = true
    reader.onload = e => {
      if (e.target.result) {
        fetch(e.target.result)
          .then(res => res.blob())
          .then(async blob => {
            const file = new File([blob], rawFile.name)
            editPhoto.value.file = file
            editPhoto.value.preview = e.target.result
            isLoading.value = false
          })
      }
    }
    reader.onerror = e => {
      isLoading.value = false
      ElMessage.error(t('圖片上傳錯誤'))
    }
    reader.readAsDataURL(rawFile)
    return false
  }

  //  表單與驗證
  const ruleFormRecf = ref(null)
  const infoForm = ref({
    nickName: '',
    tempEmail: '',
    tempPhone: '',
  })
  const rules = reactive({
    nickName: [
      {
        validator: (rule, value, callback) => {
          const name = value.replace(/[\s\u3000]+/g, '')
          if (name === '') callback(new Error(t('名稱不可空白')))
          else if (name.length > 20) callback(new Error(t('名稱不可超過20個字')))
          else callback()
        },
        trigger: 'change',
      },
    ],
    tempPhone: [
      {
        validator: (rule, value, callback) => {
          if (!value) return callback()
          return callback(/^\+?[0-9\s\-()]{7,20}$/.test(value) ? undefined : new Error(t('電話號碼格式不正確')))
        },
        trigger: 'change',
      },
    ],
    tempEmail: [
      {
        validator: (rule, value, callback) => {
          if (!value) return callback()
          return callback(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : new Error(t('email格式不正確')))
        },
        trigger: 'change',
      },
    ],
  })

  // 確認送出
  const submitForm = async () => {
    if (!ruleFormRecf.value) return
    await ruleFormRecf.value.validate(async (valid, fields) => {
      if (valid) {
        isLoading.value = true
        await updateNickName()
        await updatePhoto()
        await updateTempPhoneEmail()
        // 重新取得memberinfo
        await defaultSettingStore.reloadMemberInfo()
        isLoading.value = false
        setEditMode(false)
      }
    })
  }
  const updateNickName = async () => {
    if (infoForm.value.nickName === memberInfo.value?.memberName) return true
    try {
      const res = await postMemberNickName({ nickName: infoForm.value.nickName }).then(res => res)
      if (res.Status.Code.toString() !== '0') throw new Error()
    } catch (e) {
      ElMessage({
        showClose: true,
        message: t('名稱更新失敗，請稍後再試'),
        type: 'error',
        duration: 0,
      })
    }
  }
  const updatePhoto = async () => {
    if (!editPhoto.value.file) return
    try {
      const formData = new FormData()
      formData.append('Photo', editPhoto.value.file)
      const res = await postMemberPhoto(formData).then(res => res)
      if (res.Status.Code.toString() !== '0') throw new Error()
    } catch (e) {
      ElMessage({
        showClose: true,
        message: t('頭像更新失敗，請稍後再試'),
        type: 'error',
        duration: 0,
      })
    }
  }

  const updateTempPhoneEmail = async () => {
    try {
      const input = {
        tempEmail: memberInfo.value?.tempEmail === infoForm.value.tempEmail ? null : infoForm.value.tempEmail,
        tempPhone: memberInfo.value?.tempPhone === infoForm.value.tempPhone ? null : infoForm.value.tempPhone,
      }
      const res = await postMemberBasicData(input).then(res => res)
      if (res.Status.Code !== '0') throw new Error()
    } catch (e) {
      console.error(e)
      ElMessage({
        showClose: true,
        message: t('信箱或電話更新失敗，請稍後再試'),
        type: 'error',
        duration: 0,
      })
    }
  }
</script>
<style lang="scss" scoped>
  .view-user-info-dialog {
    max-height: calc(90svh - 120px);
    height: 100%;
    display: flex;
    flex-direction: column;
    .main-scroll {
      flex-grow: 1;
      overflow-y: scroll;
      scrollbar-width: none;
    }
    .el-avatar {
      position: relative;
    }
    .avatar-area {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 15px 0 25px 0;

      &.edit {
        .el-avatar {
          right: -40px;
        }
      }
      .avatar-frame {
        width: 135px;
        height: 135px;
        position: absolute;
        margin-top: 12px;
      }
      .upload-avatar {
        position: absolute;
        width: 80px;
        height: 80px;
        overflow: hidden;
        border-radius: 50%;
        opacity: 0.6;

        position: relative;
        z-index: 10;
        left: -40px;

        :deep(.el-upload) {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 80px;
          height: 80px;
          .el-upload-dragger {
            padding: 0;
            background-color: rgba(54, 61, 78, 0);
            width: 100%;
            border: 0;
            border-radius: 0;
            .upload-icon {
              background-color: rgba(0, 0, 0, 0.9);
              padding: 5px 0;
              i {
                color: var(--main-red);
              }
            }
          }
        }
      }
    }
    .info-form-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;

      > span {
        color: white;
        &:last-child {
          color: #8094bb;
        }
      }
    }
    :deep(.el-loading-mask) {
      background-color: #1f2530ba;

      circle {
        stroke: #ffffff;
      }
    }
    :deep(.el-form).user-info-form {
      &.el-form--label-left {
        p {
          text-align: right;
        }
        .el-form-item__content {
          justify-content: flex-end;
        }
      }

      &.el-form--label-top {
        p {
          text-align: left;
        }
      }
      .el-form-item__label {
        color: white;
      }

      p {
        color: #9ab5f1;
        width: 100%;
        margin: 0;
        word-break: break-all;
        line-height: 20px;
      }

      .el-form-item__error {
        color: var(--main-red);
        width: 100%;
        text-align: right;
        padding-top: 5px;
      }

      .top-btn {
        color: var(--main-red);
        cursor: pointer;
        display: inline-block;
      }
      .email,
      .phone {
        color: #9ab5f1;
        display: flex;
        word-break: break-all;

        .v-btn {
          flex-shrink: 0;
          cursor: pointer;
          color: var(--main-red);
        }
      }
    }

    .form-btn {
      text-align: right;
      margin-top: 15px;

      button {
        background-color: #8084bb4d;
        color: white;
        transition: 0.2s all ease;
        width: 100%;
        height: 40px;
        &:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.32);
        }
      }
      .cancel {
        border-color: #ff2d5500;
        &:hover {
          border-color: #ff2d55;
        }
      }
      .submit,
      .edit {
        border-color: var(--main-red);
        background-color: #ff2d55;
        &:hover {
          border-color: white;
        }
      }
    }

    :deep(.el-input) {
      display: block;

      .el-input__inner {
        color: white;
      }

      .el-input__wrapper {
        width: 100%;
        background-color: #293550;
        box-shadow: 0 0 0 0;
        border: 1px solid #6a7a9d;
        border-radius: 5px;
        color: white;

        input {
          text-align: right;
        }
      }
    }
  }
</style>
