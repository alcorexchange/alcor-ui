<template lang="pug">
.markets
  .table-intro
    el-radio-group.radio-chain-select.custom-radio(
      v-model='markets_active_tab',
      size='small'
    ).mr-3
      el-radio-button(label='fav')
        i.el-icon-star-on
        span Fav

      el-radio-button(label='all')
        span All

      el-radio-button(:label='network.baseToken.symbol')
        span {{ network.baseToken.symbol }}

      el-radio-button(v-if='network.name == "eos"', label='USDT')
        span USDT

      el-radio-button(value='cross-chain', label='Cross-Chain')
        span Cross-Chain

      el-radio-button(value='terraformers', label='Terraformers' v-if="network.name == 'wax'")
        span  Terraformers

    .search-container
      el-input(
        v-model='search',
        placeholder='Search market',
        size='small',
        prefix-icon='el-icon-search'
        clearable
      )

    el-switch(v-if="markets_active_tab == network.baseToken.symbol" v-model='showVolumeInUSD' active-text='USD').ml-auto

    .ml-auto
      nuxt-link(to="new_market")
        el-button(tag="el-button" size="small" icon="el-icon-circle-plus-outline") Open new market

  .table.el-card.is-always-shadow
    el-table.market-table(
      :data='filteredMarkets',
      style='width: 100%',
      @row-click='clickOrder',
      :default-sort='{ prop: "weekVolume", order: "descending" }'
    )
      el-table-column(label='Pair', prop='date', :width='isMobile ? 150 : 280')
        template(slot-scope='scope')
          TokenImage(
            :src='$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)',
            :height="isMobile? '20' : '30'"
          )

          //span TODO
          //  PairIcons(
          //    :token1="{symbol: scope.row.quote_token.symbol.name, contract: scope.row.quote_token.contract}"
          //    :token2="{symbol: scope.row.base_token.symbol.name, contract: scope.row.base_token.contract}"
          //  )

          span.ml-2
            | {{ scope.row.quote_token.symbol.name }}
            span.text-muted.ml-2(v-if='!isMobile') {{ scope.row.quote_token.contract }}
            |  / {{ scope.row.base_token.symbol.name }}

      el-table-column(
        :label='`Last price`',
        sort-by='last_price',
        align='right',
        header-align='right',
        sortable,
        :sort-orders='["descending", null]'
      )
        template(slot-scope='scope')
          .text-success(v-if="showVolumeInUSD && markets_active_tab == network.baseToken.symbol") ${{ $systemToUSD(scope.row.last_price, 8) }}
          .text-success(v-else) {{ scope.row.last_price }} {{ !isMobile ? scope.row.base_token.symbol.name : "" }}
      el-table-column(
        :label='`24H Vol.`',
        align='right',
        header-align='right',
        sortable,
        sort-by='volume24',
        :sort-orders='["descending", null]'
        v-if='!isMobile'
      )
        template(slot-scope='scope')
          span.text-mutted(v-if="showVolumeInUSD && markets_active_tab == network.baseToken.symbol") ${{ $systemToUSD(scope.row.volume24) }}
          span.text-mutted(v-else) {{ scope.row.volume24.toFixed(2) | commaFloat }} {{ scope.row.base_token.symbol.name }}

      el-table-column(
        label='24H',
        prop='name',
        align='right',
        header-align='right',
        sortable,
        width='100',
        sort-by='change24',
        :sort-orders='["descending", null]',
        v-if='!isMobile'
      )
        template(slot-scope='scope', align='right', header-align='right')
          change-percent(:change='scope.row.change24')

      el-table-column(
        label='7D Volume',
        prop='weekVolume',
        align='right',
        header-align='right',
        sortable,
        sort-by='volumeWeek',
        :sort-orders='["descending", null]',
      )
        template(slot-scope='scope')
          span.text-mutted(v-if="showVolumeInUSD && markets_active_tab == network.baseToken.symbol") ${{ $systemToUSD(scope.row.volumeWeek) }}
          span.text-mutted(v-else) {{ scope.row.volumeWeek.toFixed(2) | commaFloat }} {{ scope.row.base_token.symbol.name }}

      el-table-column(
        label='7D Change',
        prop='weekChange',
        align='right',
        header-align='right',
        sortable,
        sort-by='changeWeek',
        :sort-orders='["descending", null]',
        v-if='!isMobile'
      )
        template(slot-scope='scope')
          change-percent(:change='scope.row.changeWeek')
</template>

<script>
import { captureException } from '@sentry/browser'

import { mapGetters, mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import PairIcons from '~/components/PairIcons'

export default {
  components: {
    TokenImage,
    ChangePercent,
    PairIcons
  },

  async fetch({ store, error }) {
    if (store.state.markets.length == 0) {
      try {
        await store.dispatch('loadMarkets')
      } catch (e) {
        captureException(e)
        return error({ message: e, statusCode: 500 })
      }
    }
  },

  data() {
    return {
      search: '',

      to_assets: [],
      select: {
        from: '',
        to: ''
      },

      loading: true
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapState(['markets']),
    ...mapState('settings', ['favMarkets']),

    markets_active_tab: {
      get() {
        return this.$store.state.market.markets_active_tab || this.network.baseToken.symbol
      },

      set(value) {
        this.$store.commit('market/setMarketActiveTab', value)
      }
    },

    showVolumeInUSD: {
      get() {
        return this.$store.state.market.showVolumeInUSD
      },

      set(value) {
        this.$store.commit('market/setShowVolumeInUSD', value)
      }
    },

    filteredMarkets() {
      if (!this.markets) return []

      let markets = []
      if (this.markets_active_tab == 'all') {
        markets = this.markets
      } else if (this.markets_active_tab == this.network.baseToken.symbol) {
        markets = this.markets.filter(
          (i) => i.base_token.contract == this.network.baseToken.contract
        )
      } else if (this.markets_active_tab == 'USDT') {
        markets = this.markets.filter(
          (i) => i.base_token.contract == 'tethertether'
        )
      } else if (this.markets_active_tab == 'fav') {
        markets = this.markets.filter(
          (i) => this.favMarkets.includes(i.id)
        )
      } else if (this.markets_active_tab == 'Terraformers') {
        markets = this.markets.filter(
          (i) => i.quote_token.contract == 'unboundtoken'
        )
      } else {
        const ibcTokens = this.$store.state.ibcTokens.filter(
          (i) => i != this.network.baseToken.contract
        )

        markets = this.markets.filter((i) => {
          return (
            ibcTokens.includes(i.base_token.contract) ||
            ibcTokens.includes(i.quote_token.contract) ||
            Object.keys(this.network.withdraw).includes(i.quote_token.str) ||
            Object.keys(this.network.withdraw).includes(i.base_token.str)
          )
        })
      }

      markets = markets.filter((i) =>
        i.slug.includes(this.search.toLowerCase())
      )

      return markets.reverse()
    }
  },

  mounted() {
    const { tab, search } = this.$route.query

    if (tab) {
      this.markets_active_tab = tab
    }

    if (search) this.search = search
  },

  methods: {
    clickOrder(a, b, event) {
      if (event && event.target.tagName.toLowerCase() === 'a') return

      this.$router.push({ name: 'trade-index-id', params: { id: a.slug } })
    }
  }
}
</script>

<style lang="scss">
.theme-dark {
  .el-input__inner {
    background-color: var(--bg-alter-2);
  }
}

.theme-light .markets .el-card {
  border: none !important;
}

.markets {
  .custom-radio .el-radio-button__inner {
    padding: 8px 15px !important;
  }

}
</style>

<style lang="scss" scoped>
.table-intro {
  display: flex;
  align-items: center;
  //justify-content: space-between;
  flex-wrap: wrap;
  padding: 20px 0;
  .search-container {
    width: 450px;
  }
}
.table td,
.table th {
  border: 0 !important;
}
.last-price-item {
  width: 180px !important;
}
.pair-item {
  width: 300px !important;
}
.theme-dark {
  .markets {
    .el-card__body {
      padding: 0px;
    }
  }

  .el-input__inner {
    background-color: var(--bg-alter-2);
  }
}

.markets {
  .el-table__row {
    cursor: pointer;
  }
}
@media only screen and (max-width: 640px) {
  .table-intro {
    padding: 14px 0;
    flex-direction: column-reverse;
    justify-content: center;
    .search-container {
      width: 100%;
      margin-bottom: 12px;
    }
  }
}
</style>
