<template lang="pug">
.row.mt-3
  .col-lg-4
    el-card
      el-radio-group(v-model="tab").el-radio-full-width
        el-radio-button(label='Swap')
        el-radio-button(label='Liquidity')

      keep-alive
        component(v-bind:is="tab")
  .col-lg-8
    el-card
      .lead Liquidity Positions

</template>

<script>
import Swap from '~/components/swap/Swap.vue'
import Liquidity from '~/components/swap/Liquidity.vue'

export default {
  components: {
    Swap,
    Liquidity
  },

  fetch({ store }) {
    store.commit('swap/setInput', store.state.network.baseToken)
  },

  data() {
    return {
      tab: 'Swap'
    }
  },

  methods: {
    changeTab() {
      console.log('change tab..', this.tab)
    }
  }
}
</script>

<style scoped>
</style>
