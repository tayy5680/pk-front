import { createI18n } from 'vue-i18n'
import en from '@/i18n/en-US.json'
import tw from '@/i18n/zh-TW.json'
// import cn from '@/i18n/zh-CN.json'
// import jp from '@/i18n/ja-JP.json'
// import vn from '@/i18n/vi-VN.json'

// 加上要使用的時間語系
export const dayjsLocales = {
  'zh-TW': () => import('dayjs/locale/zh-tw'),
  'en-US': () => import('dayjs/locale/en'),
  // 'zh-CN': () => import('dayjs/locale/zh-cn'),
  // 'ja-JP': () => import('dayjs/locale/ja'),
  // 'vi-VN': () => import('dayjs/locale/vi'),
}

export const LANGUAGE_LIST = [
  { id: 'zh-TW', label: '繁體中文', local: '繁體中文', countryCallingCode: '886' },
  { id: 'en-US', label: '英文', local: 'English', countryCallingCode: '1' },
  // { id: 'zh-CN', label: '簡體中文', local: '简体中文', countryCallingCode: '86' },
  // { id: 'ja-JP', label: '日文', local: '日本語', countryCallingCode: '81' },
  // { id: 'vi-VN', label: '越南文', local: 'Tiếng Việt', countryCallingCode: '84' },
]

export const COMMING_SOON_FORMAT = {
  'en-US': { locale: 'en', format: 'dddd, MMMM D, YYYY' },
  'zh-TW': { locale: 'zh-tw', format: 'dddd, M月D日, YYYY' },
  // 'zh-CN': { locale: 'zh-cn', format: 'dddd, M月D日, YYYY' },
  // 'ja-JP': { locale: 'ja', format: 'dddd, M月D日, YYYY' },
  // 'vi-VN': { locale: 'vi', format: 'dddd, D/MM/YYYY' },
}

const messages = {
  'en-US': en,
  'zh-TW': tw,
  // 'zh-CN': cn,
  // 'ja-JP': jp,
  // 'vi-VN': vn,
}

export const i18n = createI18n({
  locale: 'en-US',
  legacy: false,
  allowComposition: true,
  globalInjection: true,
  fallbackLocale: 'zh-TW',
  messages,
})
