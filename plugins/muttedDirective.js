import Vue from 'vue'

Vue.directive('mutted', (el, { value }) => {
  value ? el.classList.add('mutted') : el.classList.remove('mutted')
})
