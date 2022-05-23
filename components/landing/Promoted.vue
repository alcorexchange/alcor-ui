<template lang="pug">
.promouted-markets
  pre promote {{ promoPair }}

  Spacer
</template>

<script>
import { mapGetters } from 'vuex'
import Spacer from '@/components/Spacer.vue'

export default {
  components: { Spacer },
  props: ['id', 'period'],
  data() {
    return {
      promoPair: null,
      charts: []
    }
  },
  computed: {
    ...mapGetters({
      pair: 'swap/getById',
      promoted: 'promoted'
    })
  },
  watch: {
    '$store.state.swap.pairs'() {
      console.log(this.promoted)
      this.promoPair = this.pair(this.promoted[0])
      //this.fetchCharts
    }
  },
  methods: {
    async fetchCharts(animate = false) {
      console.log(this.promoPair.id)
      if (this.promoPair) {
        this.charts = (await this.$axios.get(`/pools/${this.promoPair.id}/charts`, { params: { period: this.period } })).data
        console.log(this.charts)
      }
    }
  }
}
</script>
