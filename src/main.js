import { createApp } from 'vue'
import router from './router'
import './firebase'

createApp({
  template: '<router-view></router-view>'
}).use(router).mount('#app')
