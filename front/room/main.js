/**
 * Created by hackeris on 2016/10/6.
 */


import Vue from 'vue'
import VueResource from 'vue-resource'

Vue.use(VueResource);

import Room from './components/Room.vue'

new Vue({
  el: '#app',
  components: {
    Room
  }
});

