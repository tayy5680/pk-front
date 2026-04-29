import { instance } from './request.js'

export const getMemberInfo = () => {
  return instance.get('/Member/Info')
}

export const getStreamers = () => {
  return instance.get('/Stream/StreamerRecommendGet')
}

export const getCategories = () => {
  // return instance.post('')
}

// 取得遊戲清單
export const getGameList = input => {
  const params = {
    Locale: input.lang,
  }
  return instance.get('/Game/List', { params })
}
