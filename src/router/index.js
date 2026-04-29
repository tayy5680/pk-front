import { createRouter, createWebHistory } from 'vue-router'
import { useDefaultSetting } from '@/store/defaultSetting.js'

const routes = [
  {
    path: '/:type(StreamerPromotional)?/:userId?',
    name: 'Hall',
    component: () => import('@/components/Hall/index.vue'),
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('@/components/LiveBroadcast/index.vue'),
  },
  {
    path: '/member/:type(StreamerPromotional)?/:userId?',
    name: 'Member',
    component: () => import('@/components/Member/index.vue'),
  },
  {
    path: '/LegalInformation/:pageType',
    name: 'LegalInformation',
    component: () => import('@/components/LegalInformation/index.vue'),
    meta: { standalone: true },
    props: true,
  },
  {
    path: '/system',
    name: 'System',
    component: () => import('@/components/System/index.vue'),
    props: true,
  },
  {
    path: '/download',
    name: 'Download',
    component: () => import('@/components/Download/index.vue'),
  },
  {
    path: '/Mainenance',
    name: 'Mainenance',
    component: () => import('@/components/Mainenance/index.vue'),
    meta: { standalone: true },
    props: true,
  },
  // { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  // 偵測是否維護中
  const defaultSettingStore = useDefaultSetting()
  defaultSettingStore.fetchMaintenanceStatus()

  // 有token才放行的頁面
  const requiresToken = ['Member']
  // 未登入狀態沒有token則強制跳轉首頁
  const token = localStorage.getItem('userToken')
  if (!token && requiresToken.includes(to.name)) return next('/')
  next()
})

// router.afterEach((to, from) => {
//   console.log('Arrived at:', to.path)
// })

export default router
