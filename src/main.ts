import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VxeUIAll from 'vxe-pc-ui'
import VxeUITable from 'vxe-table'
import enUS from 'vxe-table/lib/locale/lang/en-US'
import './styles/main.css'
import 'uno.css'
import 'vxe-pc-ui/lib/style.css'
import 'vxe-table/lib/style.css'

VxeUITable.setI18n('en-US', enUS)
VxeUITable.setLanguage('en-US')

const app = createApp(App)
const router = createRouter({
  routes,
  history: createWebHistory(import.meta.env.BASE_URL),
})
app.use(VxeUIAll)
app.use(VxeUITable)
app.use(router)
app.use(ElementPlus)
app.mount('#app') 