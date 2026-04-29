// 抖內選項的CSS顏色與範圍
export const DONATE_CSS = [
  { optionCategoryId: 1, id: 'red', rgb: [255, 45, 85], label: '初級' },
  { optionCategoryId: 2, id: 'green', rgb: [148, 184, 51], label: '中級' },
  { optionCategoryId: 3, id: 'purple', rgb: [178, 41, 224], label: '高級' },
]

export const getRGB = CategoryId => {
  if (!CategoryId) return [255, 45, 85]
  const result = DONATE_CSS.find(({ optionCategoryId }) => optionCategoryId === CategoryId)
  return result ? result.rgb : [255, 45, 85]
}
