import axios from 'axios'
import { instance } from './request.js'

export const instanceVerification = axios.create({
  baseURL: import.meta.env.VITE_VERIFICATION_HOST,
  timeout: 10000,
})

// 傳送手機驗證碼
export const postSendPhoneVerification = input => {
  const data = {
    phone: input.phone,
  }
  return instanceVerification.post('/token/SendPhoneVerification', data)
}
// 重新發驗證碼
export const postResendVerification = input => {
  const data = {
    phone: input.phone,
  }
  return instanceVerification.post('/token/ResendVerification', data)
}

// 驗證手機驗證碼
export const postCheckPhoneLogin = input => {
  const data = {
    phone: input.phone,
    verifyCode: input.verifyCode,
    isRegister: input.isRegister,
  }
  if (input.referralCode) data.referralCode = input.referralCode
  return instanceVerification.post('/token/CheckPhoneLogin', data)
}
// 判斷電話是否註冊過
export const postCheckPhone = input => {
  const data = {
    phone: input.phone,
  }
  return instanceVerification.post('/Token/CheckPhone', data)
}

// 基本資料更新
export const postMemberBasicData = input => {
  const data = {
    country: input?.country ?? null,
    account: input?.account ?? null,
    name: input?.name ?? null,
    tempEmail: input?.tempEmail ?? null,
    tempPhone: input?.tempPhone ?? null,
  }
  if (input.referralCode) data.referralCode = input.referralCode
  return instance.post('/Member/BasicData', data)
}

// 實名驗證
export const postMemberKYC = formData => {
  return instance.post('/Member/KYC', formData)
}

// Line登入
export const postCheckLineLogin = input => {
  const data = {
    verifyCode: input.verifyCode,
    returnUrl: input.returnUrl,
  }
  if (input.referralCode) data.referralCode = input.referralCode
  return instanceVerification.post('/Token/CheckLineLogin', data)
}

// Apple登入
export const postCheckAppleLogin = input => {
  const data = {
    verifyCode: input.verifyCode,
    returnUrl: input.returnUrl,
  }
  if (input.referralCode) data.referralCode = input.referralCode
  return instanceVerification.post('/Token/CheckAppleLogin', data)
}
