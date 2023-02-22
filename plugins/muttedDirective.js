import Vue from 'vue'

Vue.directive('mutted', {
  inserted: el => {
    el.classList.add('mutted')
  }
})
