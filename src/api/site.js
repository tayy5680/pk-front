import { instance } from './request.js'

// 取得維護狀態
export const getSystemMainenance = () => {
  return instance.get('/System/Mainenance')
}
