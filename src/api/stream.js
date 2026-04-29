import { instance } from './request.js'

// 直播主取得直播頻道
export const getChannel = () => {
  return instance.get('/Stream/GetChannel')
}

// 取直播主個人資料
export const getStreamerInfo = input => {
  const params = {
    UserId: input.UserId,
  }
  return instance.get('/Stream/GetStreamerInfo', { params })
}

// 玩家取得直播列表
export const getGetStreamChannel = input => {
  const params = {
    GameId: input.GameId,
  }
  if (input?.UserId) params.UserId = input.UserId
  // 直播狀態 1:直播中, 0尚未直播
  if (input?.Status !== undefined) params.Status = input.Status
  return instance.get('/Stream/GetStreamChannel', { params })
}

// 取得直播主宣傳頁
export const getStreamerPromotional = input => {
  const params = {
    UserId: input.UserId || input.userId,
  }
  return instance.get('/Stream/GetStreamerPromotional', { params })
}

// 玩家按讚宣傳頁
export const postLikeStreamerPromotionalPhoto = input => {
  const data = {
    // userId: input.userId,
    StreamerPromotionPhotoId: input.StreamerPromotionPhotoId,
  }
  return instance.post('/Stream/LikeStreamerPromotionalPhoto', data)
}

// 玩家追蹤直播主 追蹤中改為取消追蹤, 尚未追蹤改為追蹤中
export const postFollowStreamer = input => {
  const data = {
    userId: input.userId,
    isFollow: input.isFollow ? 1 : 0,
  }
  return instance.post('/Stream/FollowStreamer', data)
}

// 已登入身份：取遊戲連結
export const getGameLink = input => {
  const params = {
    GameId: input.GameId,
    Currency: input.Currency,
    Lang: input.Lang,
    AutoTransfer: false,
  }
  return instance.get('/Game/Link', { params })
}

// 訪客身份：取遊戲連結
export const getGuestGameLink = input => {
  const params = {
    GameId: input.GameId,
    Currency: input.Currency,
    Lang: input.Lang,
    AutoTransfer: false,
  }
  return instance.get('/Game/GuestLink', { params })
}

// 取得下注清單
export const getGameBetlog = input => {
  const params = {
    GameId: input.gameid,
    Locale: input.lang,
    Page: input.page,
    PageSize: input.pageSize,
  }
  return instance.get('/Game/Betlog', { params })
}

// 取得StreamChannelId的下注清單
export const getGameBetlogStreamChannelId = input => {
  const params = {
    StreamChannelId: input.streamChannelId,
    Locale: input.lang,
    Page: input.page,
    PageSize: input.pageSize,
    IsPersonal: 1,
  }
  return instance.get('/Game/Betlog/StreamChannelId', { params })
}

// 取得違規種類清單
export const getViolationCategories = input => {
  const params = {
    Locale: input.lang,
  }
  return instance.get('/Violation/GetCategories', { params })
}

// 提交違規檢舉
// Code = "4001" 檢舉重複
export const postViolationAccuse = input => {
  const data = {
    userId: input.userId,
    streamChannelId: input.streamChannelId,
    id: input.id,
    cause: input.cause,
    violationOptionId: input.violationOptionId,
  }
  return instance.post('/Violation/Accuse', data)
}
