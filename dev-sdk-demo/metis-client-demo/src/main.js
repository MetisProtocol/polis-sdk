import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui';
import VueWorker from 'vue-worker'
import 'element-ui/lib/theme-chalk/index.css';
import VConsole from 'vconsole';


// const vconsole = new VConsole();

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.use(VueWorker)
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
