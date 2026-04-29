import countries from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import tw from './countries-tw.json'
// import ja from 'i18n-iso-countries/langs/ja.json'
// import cn from 'i18n-iso-countries/langs/zh.json'
// import vi from 'i18n-iso-countries/langs/vi.json'

countries.registerLocale(en)
countries.registerLocale(tw)
// countries.registerLocale(ja)
// countries.registerLocale(cn)
// countries.registerLocale(vi)

export function getCountryList(locale = 'en-US') {
  const lang = locale.split('-')[0]
  const countryObj = countries.getNames(lang, { select: 'official' })
  return Object.entries(countryObj).map(([code, name]) => ({
    value: code.toLowerCase(),
    label: locale === 'zh-TW' ? tw.countries?.[code] ?? name : name,
    flag: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
  }))
}
