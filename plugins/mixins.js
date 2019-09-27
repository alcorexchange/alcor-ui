import Vue from 'vue'


Vue.mixin({
  methods: {
    unitPriceInfo() {
      this.$alert(
        `Since the price calculation is calculated using int64 value,
        then with increasing accuracy of quantity or price,
        the price can be a floating point period. At the moment,
        this price format is not supported. We are sorry :( `,

        'About calculation of price', {
          closeOnClickModal: true,
          confirmButtonText: 'Ok then..'
      })
    }
  }
})
