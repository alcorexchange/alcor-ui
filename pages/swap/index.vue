<template lang="pug">
  .swap-container
    .swap-card
      .alcor-card
        .tab-bar
          .item(@click="changeTab('Swap')" :class="{active: tab === 'Swap'}") Swap
          .item(@click="changeTab('+ Liquidity')" :class="{active: tab === '+ Liquidity'}") + liquidity
          .item(@click="changeTab('- Liquidity')" :class="{active: tab === '- Liquidity'}") - liquidity
        SSpacer(high)
        .tab-item
          keep-alive
            AddLiquidity(v-if="tab === '+ Liquidity'")
            RemoveLiquidity(v-else-if="tab === '- Liquidity'")
            Swap(v-else)
    .chart-card(v-if="tab == 'Swap'")
      .header
        .pair-container(v-if="current")
          .left
            PairIcons(
              :firstIcon="$tokenLogo(current.pool1.quantity.symbol.code().to_string(), current.pool1.contract)",
              :secondIcon="$tokenLogo(current.pool2.quantity.symbol.code().to_string(), current.pool2.contract)"
            )
            .name-container
              .names(v-if="!isReverted") {{ current.pool1.quantity.symbol.code().to_string() }}/{{ current.pool2.quantity.symbol.code().to_string() }}
              .names(v-else) {{ current.pool2.quantity.symbol.code().to_string() }}/{{ current.pool1.quantity.symbol.code().to_string() }}

              .detail.muted Liquidity alcor.dex
          .right
            AlcorButton.eol Earn On Liquidity
      SSpacer(high)
      .chart
        Chart(:tab="chart_tab")
      SSpacer(high)
      .footer
        .left
            span.item(@click="setChartTab('Price')" :class="{active: chart_tab === 'Price'}") Price
            span.item(@click="setChartTab('Liquidity')" :class="{active: chart_tab === 'Liquidity'}") Liquidity
            span.item(@click="setChartTab('Volume')" :class="{active: chart_tab === 'Volume'}") Volume
        //.right TODO Timeframes for chart
            span.item.active 24H
            span.item 7D
            span.item 30D
            span.item All
    LiquidityPositions.liquidity-positions(v-else)
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import Swap from '~/components/swap/Swap.vue'
import Chart from '~/components/swap/Chart.vue'
import AddLiquidity from '~/components/swap/AddLiquidity.vue'
import RemoveLiquidity from '~/components/swap/RemoveLiquidity.vue'
import LiquidityPositions from '~/components/swap/LiquidityPositions.vue'
import AlcorButton from '~/components/AlcorButton.vue'
import SSpacer from '~/components/SSpacer.vue'
import Spacer from '~/components/Spacer.vue'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'

export default {
  components: {
    Swap,
    Chart,
    AddLiquidity,
    RemoveLiquidity,
    LiquidityPositions,
    SSpacer,
    Spacer,
    AlcorButton,
    TokenImage,
    PairIcons
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
    ...mapGetters('swap', ['current', 'isReverted']),

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
            query: {
              ...this.$route.query,
              output: this.output.symbol + '-' + this.output.contract
            }
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
            query: {
              ...this.$route.query,
              input: this.input.symbol + '-' + this.input.contract
            }
          })
        }, 1)
      } else {
        this.$router.push({ path: this.$route.path })
      }
    }
  },

  beforeRouteLeave(to, from, next) {
    this.$socket.emit('unsubscribe', {
      room: 'pools',
      params: { chain: this.network.name }
    })
    next()
  },

  mounted() {
    this.$socket.emit('subscribe', {
      room: 'pools',
      params: { chain: this.network.name }
    })

    this.$socket.on('update_pair', (data) => {
      this.$store.dispatch('swap/updatePairOnPush', data)
    })
  },

  methods: {
    changeTab(tab) {
      this.$store.commit('swap/setTab', tab)
    },
    setChartTab(tab) {
      this.chart_tab = tab
    }
  },

  head() {
    const { input, output } = this.$store.state.swap

    const title =
      input && output
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
      meta.push({
        hid: 'og:image',
        name: 'og:image',
        content: this.$tokenLogo(output.symbol, output.contract)
      })
    }

    return {
      title,
      meta
    }
  }
}
</script>

<style lang="scss" scoped>
.swap-container {
  display: flex;
  padding-top: 20px;
}
.swap-card {
  width: 33.3333%;
}
.tab-bar {
  display: flex;
  background: var(--bg-alter-2);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: var(--radius-2);
  overflow: hidden;
  .item {
    flex: 1;
    text-align: center;
    padding: 4px;
    border-radius: var(--radius-2);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s;
    &.active {
      background: var(--btn-active);
      box-shadow: 0px 3px 28px -1px rgba(0, 0, 0, 0.4);
      // color: var(--background-color-base);
    }
  }
}
.chart-card,
.liquidity-positions {
  flex: 1;
  margin-left: 30px;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  flex-direction: column;
  .pair-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .left {
      display: flex;
      align-items: center;
    }
    .eol {
      border-radius: var(--radius);
      padding: 6px 24px;
    }
    .icons {
      position: relative;
      display: flex;
      height: 40px;
      width: 40px;
      .icon {
        position: absolute;
        width: 25px;
        height: 25px;
        object-fit: cover;
        border-radius: 50%;
      }
      .icon-1 {
        top: 0;
        left: 0;
      }
      .icon-2 {
        bottom: 0;
        right: 0;
      }
    }
    .name-container {
      padding-left: 10px;
      .names {
        font-size: 1.6rem;
        font-weight: bold;
      }
      display: flex;
      flex-direction: column;
    }
  }
}
.chart {
  min-height: 200px;
  flex: 1;
}

.footer {
  display: flex;
  justify-content: space-between;
  .left,
  .right {
    display: flex;
    align-items: center;
    .item {
      user-select: none;
      display: flex;
      padding: 4px 6px;
      border-radius: var(--radius);
      cursor: pointer;
      &.active {
        background: var(--swap-tab-active);
      }
    }
  }
}
@media only screen and (max-width: 980px) {
  .swap-container {
    flex-direction: column;
  }
  .swap-card {
    width: 100%;
    margin-bottom: 20px;
  }
  .chart-card,
  .liquidity-positions {
    margin-left: 0;
  }
}
@media only screen and (max-width: 680px) {
  .tab-bar {
    .item {
      font-size: 0.9rem;
    }
  }
  .header {
    .pair-container {
      flex-direction: column;
      align-items: flex-start;
      .right {
        margin: 8px 0;
      }
    }
  }
  .footer {
    flex-direction: column;
    .left {
      margin-bottom: 8px;
    }
  }
  .alcor-card {
    padding: 8px;
  }
}
</style>
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
