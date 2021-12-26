<template lang="pug">
  .swap-container
    .swap-card
      .alcor-card
        .tab-bar
          .item(@click="changeTab('Swap')" :class="{active: tab === 'Swap'}") Swap
          .item.center(@click="changeTab('+ Liquidity')" :class="{active: tab === '+ Liquidity'}") + liquidity
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
              :token1="{symbol: current.pool1.quantity.symbol.code().to_string(), contract: current.pool1.contract}"
              :token2="{symbol: current.pool2.quantity.symbol.code().to_string(), contract: current.pool2.contract}"
            )
            //- PairIcons(
            //-   :firstIcon="$tokenLogo(current.pool1.quantity.symbol.code().to_string(), current.pool1.contract)",
            //-   :secondIcon="$tokenLogo(current.pool2.quantity.symbol.code().to_string(), current.pool2.contract)"
            //- )
            .name-container
              .names(v-if="!isReverted") {{ current.pool1.quantity.symbol.code().to_string() }}/{{ current.pool2.quantity.symbol.code().to_string() }}
              .names(v-else) {{ current.pool2.quantity.symbol.code().to_string() }}/{{ current.pool1.quantity.symbol.code().to_string() }}

              .detail.muted Liquidity alcor.dex
          .right
            AlcorButton.eol(@click="openInNewTab('https://docs.alcor.exchange/liquidity-pools/understanding-returns')") Earn On Liquidity
      SSpacer(high)
      .chart
        Chart(:tab="chart_tab" :period="period")
      SSpacer(high)
      .footer
        .left
          el-radio-group.custom-radio(v-model="chart_tab" size="small")
            el-radio-button(label="Price")
            el-radio-button(label="Liquidity")
            el-radio-button(label="Volume")
        .right
          el-radio-group.custom-radio(v-model="period" size="small")
            el-radio-button(label="24H")
            el-radio-button(label="7D")
            el-radio-button(label="30D")
            el-radio-button(label="All")
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
      chart_tab: 'Price',
      period: '7D'
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
    tab() {
      this.$store.dispatch('loadLPTBalances')
    },

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
    this.$store.dispatch('swap/startStream')
    // TODO Move to swap store
    //this.$socket.emit('subscribe', {
    //  room: 'pools',
    //  params: { chain: this.network.name }
    //})

    //this.$socket.on('update_pair', (data) => {
    //  this.$store.dispatch('swap/updatePairOnPush', data)
    //})
  },

  destroyed() {
    this.$store.dispatch('swap/stopStream')
  },

  methods: {
    changeTab(tab) {
      this.$store.commit('swap/setTab', tab)
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
    &.center {
      margin: 0 2px;
    }
    &:hover {
      background: var(--hover);
    }
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
        background: var(--btn-active);
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

.theme-light {
  .tab-bar {
    .item {
      //&:hover,
      &.active {
        background: var(--background-color-base);
      }
    }
  }
}
</style>
