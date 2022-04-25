<template lang="pug">
.markets-bar
  el-tabs(v-model='sideMaretsTab', size='mini' type="border-card")
    el-tab-pane(name='fav')
      span(slot='label')
        i.el-icon-star-off(:class='{ "el-icon-star-on": isFavorite }')
    el-tab-pane(label='All', name='all')
    el-tab-pane(
      :label='network.baseToken.symbol',
      :name='network.baseToken.symbol'
    )
    el-tab-pane(label='Wrapped', name='wrapped')

  .px-2.mt-2
    el-input(
      size='small',
      v-model='search',
      placeholder='Filter by token',
      clearable
      width="60%"
    )
       template(v-if="sideMaretsTab == network.baseToken.symbol" slot="append")
        el-checkbox(v-model="showVolumeInUSD") USD
  el-table(
    :data='lazyMarkets',
    row-key="id"
    style='width: 100%',
    @row-click='setMarket',
    :default-sort='{ prop: "volume24", order: "descending" }',
    :row-class-name='activeRowClassName',
    width='100%',
    v-loading='loading'
  )
    el-table-column(
      prop='quote_token.symbol.name',
      label='Pair(a-z)',
      width='130',
      sortable,
      :sort-orders='["descending", "ascending"]'
    )
      template(slot-scope='scope')
        i.el-icon-star-off.mr-1(
          :class='{ "el-icon-star-on": isFavoriteId(scope.row.id) }',
          @click='toggleFav($event, scope.row.id)'
        )
        TokenImage(
          :src='$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)',
          height='20'
        )
        small.ml-1 {{ scope.row.quote_token.symbol.name }}
        small.ml-1 / {{ scope.row.base_token.symbol.name }}

    el-table-column(
      prop='last_price',
      label='Price',
      align='right',
      sortable,
      :sort-orders='["descending", null]'
      width="70"
    )
      template(slot-scope='scope')
        | {{ scope.row.last_price | commaFloat(5) }}

    el-table-column(
      prop='volume24',
      :sort-orders='["descending", "ascending"]',
      label='Vol 24H',
      align='right',
      sortable,
    )
      template(slot-scope='scope')
        span.text-mutted(v-if="showVolumeInUSD && sideMaretsTab == network.baseToken.symbol") ${{ $systemToUSD(scope.row.volume24) }}
        span.text-mutted(v-else) {{ scope.row.volume24.toFixed(2) | commaFloat }} {{ scope.row.base_token.symbol.name }}

    template(slot="append")
      infinite-loading(@infinite='lazyloadMarkets' spinner="spiral" ref="infinite")
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  scrollToTop: false,

  components: {
    TokenImage,
    ChangePercent,
  },

  data() {
    return {
      search: '',
      skip: 0,
      lazyMarkets: [],
      loading: false,
    }
  },

  watch: {
    search() {
      this.$refs.infinite.stateChanger.reset()
      this.lazyMarkets = []
      this.skip = 0
    }
  },

  computed: {
    ...mapState(['markets', 'network']),
    ...mapState('market', ['id', 'quote_token']),
    ...mapState('settings', ['favMarkets']),

    showVolumeInUSD: {
      get() {
        return this.$store.state.market.showVolumeInUSD
      },

      set(value) {
        this.$store.commit('market/setShowVolumeInUSD', value)
      }
    },

    sideMaretsTab: {
      get() {
        return this.$store.state.settings.sideMaretsTab
      },

      set(value) {
        this.$store.commit('settings/setSideMaretsTab', value)
      },
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    },

    filteredMarkets() {
      if (!this.markets) return []

      let markets = []
      if (this.sideMaretsTab == 'all') {
        markets = this.markets
      } else if (this.sideMaretsTab == this.network.baseToken.symbol) {
        markets = this.markets.filter(
          (i) => i.base_token.contract == this.network.baseToken.contract
        )
      } else if (this.sideMaretsTab == 'USDT') {
        markets = this.markets.filter(
          (i) => i.base_token.contract == 'tethertether'
        )
      } else if (this.sideMaretsTab == 'fav') {
        markets = this.markets.filter((i) => this.favMarkets.includes(i.id))
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

      markets = markets.filter((i) => {
        return !this.network.SCAM_CONTRACTS.includes(i.quote_token.contract)
      })

      markets = markets
        .filter((i) => i.slug.includes(this.search.toLowerCase()))
        .sort((a, b) => b.volume24 - a.volume24)

      return markets
    },
  },

  methods: {
    setMarket(market) {
      if (this.id) {
        this.$store.dispatch('market/unsubscribe', this.id)
      }

      this.$router.push(
        { name: 'trade-index-id', params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
    },

    activeRowClassName({ row }) {
      let c = 'pointer'
      if (row.id == this.id) {
        c += ' active-row'
      }

      return c
    },

    isFavoriteId(id) {
      return this.favMarkets.includes(id)
    },

    toggleFav(e, id) {
      e.stopPropagation()
      e.preventDefault()
      e = e || window.event
      const width = window.innerWidth || document.body.clientWidth
      const height = window.innerHeight || document.body.clientHeight

      if (this.isFavoriteId(id)) {
        this.$store.commit(
          'settings/setFavMarkets',
          this.favMarkets.filter((m) => m != id)
        )
      } else {
        const burst = this.$vuemo.Burst({
          radius: { 0: 20 },
          count: 3,
          degree: 60,
          rotate: -30,
          children: {
            shape: 'polygon',
            points: 5,
            fill: { white: 'white' },
            rotate: { 270: 0 },
            duration: 2000,
            radius: { 0: 'rand(8, 12)' },
            delay: 'stagger( rand(0, 100) )',
          },
        })

        const circle = this.$vuemo.Shape({
          left: 0,
          top: 0,
          radius: { 0: 16, easing: 'sin.out' },
          fill: 'none',
          stroke: 'white',
          strokeWidth: { 10: 0 },
          duration: 450,
          easing: 'cubic.out',
        })
        burst
          .tune({
            x: e.clientX - width / 2 + 8,
            y: e.clientY - height / 2,
          })
          .setSpeed(3)
          .replay()

        circle
          .tune({
            x: e.clientX - width / 2 + 8,
            y: e.clientY - height / 2,
          })
          .replay()
        this.$store.commit(
          'settings/setFavMarkets',
          this.favMarkets.concat([id])
        )
      }
    },

    lazyloadMarkets($state) {
      const append = this.filteredMarkets.slice(this.skip, this.skip + 20)

      if (append.length > 0) {
        this.skip += 20
        this.lazyMarkets.push(...append)

        $state.loaded()
      } else {
        $state.complete()
      }
    },
  },
}
</script>

<style lang="scss">
.theme-dark {
  .markets-bar .el-table {
    th,
    tr {
      background: var(--background-color-base);
    }

    .el-table__row {
      &:hover {
        & td,
        & th,
        & tr {
          background: var(--btn-active) !important;
        }
      }
    }

    .active-row {
      & td,
      & th,
      & tr {
        background: var(--btn-active) !important;
      }
    }
  }
}

.markets-bar {
  height: 100%;

  .el-table--fit {
    height: calc(100% - 70px);
  }
  .el-table__body-wrapper{
    height: calc(100% - 50px);
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.markets-bar .el-table .active-row {
  background: #e6eef1;
}
</style>
