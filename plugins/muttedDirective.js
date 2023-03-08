import Vue from 'vue'

Vue.directive('mutted', {
  inserted: (el, { value }) => {
    value && el.classList.add('mutted')
  }
})
