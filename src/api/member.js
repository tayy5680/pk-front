import { instance } from './request.js'

// 玩家取得抖內紀錄
export const getPlayerDonateRecord = input => {
  const params = {
    Locale: input.lang,
  }
  return instance.get('/Donate/Player/GetRecord', { params })
}

//  取得玩家追蹤名單
export const getPlayerFollowList = () => {
  return instance.get('/Stream/PlayerFollowGet')
}

// 修改暱稱
export const postMemberNickName = input => {
  const data = {
    nickName: input.nickName,
  }
  return instance.post('/Member/NickName', data)
}

// 修改頭像
export const postMemberPhoto = formData => {
  return instance.post('/Member/Photo', formData)
}

// 會員頁面傳送驗證碼
export const postMemberSendVerification = input => {
  const data = {
    phone: input.phone,
    email: input.email,
  }
  return instance.post('/Member/SendVerification', data)
}
// 會員頁面確認驗證碼
export const postMemberCheckVerification = input => {
  const data = {
    phone: input.phone,
    email: input.email,
    verifyCode: input.verifyCode,
  }
  return instance.post('/Member/CheckVerification', data)
}

// 取得通知
export const getMemberNotification = input => {
  const params = {
    Locale: input.lang,
    Page: input?.page ?? 1,
    PageSize: input?.pageSize ?? 20,
  }
  return instance.get('/Member/Notification/Get', { params })
}

// 讀取通知
export const postMemberNotificationRead = input => {
  const data = {
    notificationId: input.notificationId,
  }
  return instance.post('/Member/Notification/Read', data)
}

// 刪除通知
export const postMemberNotificationDel = input => {
  const data = {
    notificationId: input.notificationId,
  }
  return instance.post('/Member/Notification/Del', data)
}

// 玩家綁定直播主推薦碼
export const postBindReferralCode = input => {
  const data = {
    referralCode: input.referralCode,
  }
  return instance.post('/Member/BindReferralCode', data)
}

// 上傳語系給api
export const postLocaleUpdate = input => {
  const data = {
    locale: input.locale,
  }
  return instance.post('/Member/Locale/Update', data)
}
