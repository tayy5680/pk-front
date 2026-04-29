<template>
  <div class="view-register" :class="{ cssDark: route.name === 'Member' }">
    <div class="bg-main">
      <div class="close" v-if="processData.typeStep !== 2"><i class="bi bi-x" @click="close"></i></div>
      <transition @before-enter="beforeEnter" @enter="enter" :css="false" class="h-100">
        <div v-if="showMain" class="mainmain" :key="changeKey">
          <ViewTerms v-if="processData.step == 1" />
          <ViewSignIn v-if="processData.step == 2" />
          <ViewForm v-if="processData.step == 3" />
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
  import { ref, watch, provide, onMounted, onUnmounted } from 'vue'
  import ViewTerms from './Terms.vue'
  import ViewSignIn from './SignIn.vue'
  import ViewForm from './Form.vue'
  import { useRoute } from 'vue-router'
  import { useDefaultSetting } from '@/store/defaultSetting.js'
  const defaultSettingStore = useDefaultSetting()
  const route = useRoute()
  /** @param {Number} step
   * step 1:Cofun LIVE的《條款與政策》 <Terms.vue>
   * step 2:選擇註冊/登入的方式  <SignIn.vue>
   * step 3:填寫註冊表單 <Form.vue>
   * @param {Boolean} isRegister  isRegister ? '註冊' : '登入'
   * @param {String} type phone / line / apple
   * @param {Number} typeStep
   * typeStep 1:註冊  <FormStep1.vue>
   * typeStep 2:基本資料填寫 <FormStep2.vue>
   * typeStep 3:個人實名驗證 <FormStep3.vue>
   */
  const processData = ref({
    step: defaultSettingStore.registerVisible.isRegister ? 1 : 2,
    isRegister: defaultSettingStore.registerVisible.isRegister,
    type: 'phone',
    typeStep: 1,
  })
  provide('processData', processData)
  onMounted(() => {
    // 顯示填寫基本資料的頁面
    if (defaultSettingStore.registerVisible.isBasicDataEmpty) {
      processData.value.step = 3
      processData.value.isRegister = true
      processData.value.typeStep = 2
    }
    //	kycStatus驗證狀態: 0尚未驗證,1審核中,2已通過,3未通過
    else if (defaultSettingStore.memberInfo?.kycStatus === 0) {
      processData.value.step = 3
      processData.value.typeStep = 3
    }
  })

  const close = () => {
    defaultSettingStore.setRegisterVisible({ isVisible: false })
  }

  // <transition> 用參數與監聽
  const changeKey = ref(0)
  const showMain = ref(true)
  const beforeEnter = el => {
    el.style.opacity = '1'
  }
  const enter = (el, done) => {
    el.style.transition = 'opacity 0.3s'
    el.style.opacity = '0'
    setTimeout(() => {
      el.style.opacity = '1'
      done()
    }, 200)
  }
  watch(
    () => processData.value.step,
    () => {
      changeKey.value++
    },
  )
  watch(
    () => processData.value.isRegister,
    () => {
      changeKey.value++
    },
  )
  watch(processData, () => {
    // 触发重新渲染以应用动画
    showMain.value = false
    setTimeout(() => {
      showMain.value = true
    }, 50)
  })

  onUnmounted(() => {
    defaultSettingStore.reloadMemberInfo()
  })
</script>

<style lang="scss" scoped>
  .view-register {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #000000ab;
    padding: 20px 15px;

    .close {
      i::before {
        background-color: #d9d9d9;
        color: white;
        border-radius: 50%;
      }
    }

    .bg-main {
      background-color: white;
      padding: 30px 40px;
      border-radius: 10px;
      max-width: 450px;
      width: 100%;
      overflow: hidden;
      min-height: 70svh;
      max-height: 90svh;
      display: flex;
      flex-direction: column;
      .close {
        color: #d9d9d9;
        font-size: 30px;
        height: 10px;
        position: relative;
        z-index: 1;
        text-align: right;

        i {
          cursor: pointer;
        }
      }

      .mainmain {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        > div {
          flex-grow: 1;
        }
      }
    }

    // 會員頁面暗色版本css
    &.cssDark {
      .close {
        i::before {
          background-color: #d9d9d900;
          color: #9097ac;
        }
      }

      .bg-main {
        background-color: #293550;
        color: white;
        padding: 20px 20px 30px 20px;

        :deep(.title) {
          h3 {
            text-align: center;
            font-size: 20px;
            font-weight: normal !important;
          }
        }
        :deep(.view-register-form-step-3) {
          padding-top: 0;

          .btn-group {
            button {
              border-radius: 5px;
              border: 0;
              &.skip {
                background-color: #6a7a9d;
              }
              &.next {
                background: #ff2d55;
              }
            }
          }
        }

        :deep(.el-form) {
          .el-form-item__label {
            color: white;
            font-weight: bold;
            font-size: 14px;
          }

          .el-input,
          .el-select {
            border-radius: 5px;
            border-color: #5a6b8d;
            .el-input__wrapper,
            .el-select__wrapper {
              border-radius: 5px;
              background-color: #00000000;
              input,
              .el-select__placeholder {
                color: white;
              }
            }
          }

          .vti__input {
            border-radius: 5px;
            border-color: #5a6b8d;
            background-color: #00000000;
            color: white;
          }

          .upload-tip {
            font-size: 14px;
            color: #61739c;
          }
          .upload-id-card {
            .el-upload-list__item-file-name {
              color: #73a0f6;
            }
            .el-upload {
              .el-upload-dragger {
                background-color: #00000000;
                button {
                  border-radius: 5px;
                  background-color: #242937;
                  font-size: 14px;
                  &:hover {
                    background-color: #6b7a9d;
                  }
                }
              }
            }
            .el-upload-list {
              border-radius: 5px;
              border-color: #5a6b8d;
              font-size: 14px;
            }
          }
        }
      }
    }
  }
</style>
