import Vue from 'vue'

Vue.mixin({
  methods: {
    unitPriceInfo() {
      this.$alert(
        `Since the price calculation is calculated using int64 value,
        then with increasing accuracy of quantity or price,
        the price can be a floating point period. At the moment,
        the floating point price is not supported.
        It can not be stored in contract RAM
        We are sorry :(`,

        'The price is floating point number', {
          closeOnClickModal: true,
          confirmButtonText: 'Ok!'
        }
      )
    }
  }
})
