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
            el-radio-button(label='Volume')
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

  fetch({ store, route }) {
    const { input, output } = route.query

    if (input) {
      const [symbol, contract] = input.split('-')
      store.commit('swap/setInput', { symbol, contract })
    }

    if (output) {
      const [symbol, contract] = output.split('-')
      store.commit('swap/setOutput', { symbol, contract })
    }
  },

  data() {
    return {
      chart_tab: 'Price'
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('swap', ['tab', 'input', 'output']),
    ...mapGetters('swap', ['current']),

    tabComponent() {
      if (this.tab == '+ Liquidity') return 'AddLiquidity'
      if (this.tab == '- Liquidity') return 'RemoveLiquidity'

      return 'Swap'
    }
  },

  watch: {
    output() {
      if (this.output) {
        setTimeout(() => {
          this.$router.push({
            path: this.$route.path,
            query: { ...this.$route.query, output: this.output.symbol + '-' + this.output.contract }
          })
        }, 1)
      } else {
        this.$router.push({ path: this.$route.path })
      }
    },

    input() {
      if (this.input) {
        setTimeout(() => {
          this.$router.push({
            path: this.$route.path,
            query: { ...this.$route.query, input: this.input.symbol + '-' + this.input.contract }
          })
        }, 1)
      } else {
        this.$router.push({ path: this.$route.path })
      }
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
    const { input, output } = this.$store.state.swap

    const title = (input && output)
      ? `Alcor Exchange | Swap ${input.symbol} for ${output.symbol}`
      : 'Alcor Exchange | Swap & Earn on your Liquidity'

    const meta = [
      {
        hid: 'description',
        name: 'description',
        content: 'Easy token swap, with liquidity providers earnings.'
      }
    ]

    if (input && output) {
      meta.push({ hid: 'og:image', name: 'og:image', content: this.$tokenLogo(output.symbol, output.contract) })
    }

    return {
      title,
      meta
    }
  }
}
</script>

<style lang="scss">
.el-card.swap-card {
  overflow: visible;

  .el-button--mini {
    padding: 0px 15px;
  }
}

.pools-chart {
  height: calc(100% - 16px);

  .el-card__body {
    height: calc(100% - 35px);
    padding: 5px;
  }
}
</style>
