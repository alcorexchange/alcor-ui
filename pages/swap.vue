<template lang="pug">
.row.mt-3
  .col-lg-4
    el-card.mb-3.swap-card
      el-radio-group(v-model="$store.state.swap.tab" @change="changeTab" size="small").el-radio-full-width
        el-radio-button(label='Swap')
        el-radio-button(label='+ Liquidity')
        el-radio-button(label='- Liquidity')

      keep-alive
        component(v-bind:is="tabComponent")

      .ml-auto
        el-button(type="text" size="small" @click="openInNewTab('https://www.youtube.com/watch?v=cizLhxSKrAc&t=34s')") How swap & revenue works?
  .col-lg-8
    .pools-chart(v-if="tab == 'Swap'")
      el-card.h-100
        Chart(:tab="chart_tab").h-100

        .px-2
          el-radio-group(v-model="chart_tab" size="small")
            el-radio-button(label='Price')
            el-radio-button(label='Liquidity')
            //el-radio-button(label='Volume')
    el-card(v-else)
      LiquidityPositions

</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Swap from '~/components/swap/Swap.vue'
import Chart from '~/components/swap/Chart.vue'
import AddLiquidity from '~/components/swap/AddLiquidity.vue'
import RemoveLiquidity from '~/components/swap/RemoveLiquidity.vue'
import LiquidityPositions from '~/components/swap/LiquidityPositions.vue'

export default {
  components: {
    Swap,
    Chart,
    AddLiquidity,
    RemoveLiquidity,
    LiquidityPositions
  },

  fetch({ store }) {
    store.commit('swap/setInput', store.state.network.baseToken)
  },

  data() {
    return {
      chart_tab: 'Price'
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('swap', ['tab']),
    ...mapGetters('swap', ['current']),

    tabComponent() {
      if (this.tab == '+ Liquidity') return 'AddLiquidity'
      if (this.tab == '- Liquidity') return 'RemoveLiquidity'

      return 'Swap'
    }
  },

  beforeRouteLeave (to, from, next) {
    this.$socket.emit('unsubscribe', { room: 'pools', params: { chain: this.network.name } })
    next()
  },

  mounted() {
    this.$socket.emit('subscribe', { room: 'pools', params: { chain: this.network.name } })

    this.$socket.on('update_pair', data => {
      this.$store.dispatch('swap/updatePairOnPush', data)
    })
  },

  methods: {
    changeTab(tab) {
      this.$store.commit('swap/setTab', tab)
    }
  },

  head() {
    return {
      title: 'Alcor Exchange | Swap & Earn on your Liquidity',

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Uniswap like token exchange, with liquidity providers earnings.'
        }
      ]
    }
  }
}
</script>

<style lang="scss">
.el-card.swap-card {
  overflow: visible;
}

.pools-chart {
  height: calc(100% - 16px);

  .el-card__body {
    height: calc(100% - 35px);
    padding: 5px;
  }
}
</style>
