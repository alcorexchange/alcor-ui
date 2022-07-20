<template lang="pug">
.markets-bar
  alcor-tabs(v-model='sideMaretsTab', size='mini' type="border-card").border-tabs
    template(slot="right")
      .mobile-close(@click="$emit('close')")
        i.el-icon-close

    el-tab-pane(name='fav')
      span(slot='label')
        i.el-icon-star-off(:class='{ "el-icon-star-on": isFavorite }')

    el-tab-pane(:label='$t("All")', name='all')
    el-tab-pane(:label='network.baseToken.symbol' name='system')
    el-tab-pane(:label='$t("Wrapped")', name='wrapped')

  .px-2.pt-2
    el-input(
      size='small',
      v-model='search',
      :placeholder='$t("Filter by token")',
      clearable
      autofocus
      width="60%"
    )
      template(v-if="sideMaretsTab == 'system'" slot="append")
        el-checkbox(v-model="showVolumeInUSD") USD

  virtual-table.market-table(:table="virtualTableData")
    template(#row="{ item }")
      .market-table-row(@click="() => setMarket(item)" :class="{ 'active-row': id === item.id }")
        .pair-name
          i.el-icon-star-off.mr-1(
            :class='{ "el-icon-star-on": isFavoriteId(item.id) }',
            @click='toggleFav($event, item.id)'
          )
          TokenImage(
            :src='$tokenLogo(item.quote_name, item.contract)',
            height='20'
          )
          span
            small.ml-1 {{ item.quote_name }}
            small.ml-1 / {{ item.base_name }}

        .pair-price {{ item.last_price | commaFloat(5) }}
        .pair-volume
          span.text-mutted(v-if="showVolumeInUSD && sideMaretsTab == 'system'") ${{ $systemToUSD(item.volume24) }}
          span.text-mutted(v-else) {{ item.volume24.toFixed(2) | commaFloat(0) }} {{ item.base_name }}

</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import VirtualTable from '~/components/VirtualTable'

export default {
  components: {
    TokenImage,
    ChangePercent,
    VirtualTable
  },

  data() {
    return {
      search: ''
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
      }
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    },

    filteredMarkets() {
      if (!this.markets) return []

      let markets = []

      console.log(this.sideMaretsTab)

      switch (this.sideMaretsTab) {
        case 'all':
          markets = this.markets
          break

        case 'system':
          markets = this.markets.filter(
            i => i.base_token.contract == this.network.baseToken.contract)
          break

        case 'USDT':
          markets = this.markets.filter(
            i => i.base_token.contract == 'tethertether'
          )
          break

        case 'fav':
          markets = this.markets.filter(
            i => this.favMarkets.includes(i.id)
          )
          break

        case 'Terraformers':
          markets = this.markets.filter(
            i => i.quote_token.contract == 'unboundtoken'
          )
          break

        default: {
          const ibcTokens = this.$store.state.ibcTokens.filter(
            i => i != this.network.baseToken.contract
          )
          markets = this.markets.filter((i) => {
            return (
              ibcTokens.includes(i.base_token.contract) ||
              ibcTokens.includes(i.quote_token.contract) ||
              Object.keys(this.network.withdraw).includes(i.quote_token.str) ||
              Object.keys(this.network.withdraw).includes(i.base_token.str)
            )
          })
          break
        }
      }

      markets = markets
        .filter(i => i.slug.includes(this.search.toLowerCase()) && !i.scam)
        .sort((a, b) => b.volumeWeek - a.volumeWeek)
        .reduce((res, i) => {
          i.promoted ? res.unshift(i) : res.push(i)
          return res
        }, [])

      return markets
    },

    virtualTableData() {
      const header = [
        {
          label: 'Pair(a-z)',
          value: 'quote_name',
          width: '30%'
        },
        {
          label: 'Price',
          value: 'last_price',
          width: '35%',
          sortable: true
        },
        {
          label: 'Vol 24h',
          value: 'volume24',
          width: '35%',
          sortable: true,
        }
      ]

      const data = this.filteredMarkets.map(market => ({
        id: market.id,
        slug: market.slug,
        quote_name: market.quote_token.symbol.name,
        contract: market.quote_token.contract,
        base_name: market.base_token.symbol.name,
        promoted: market.promoted,
        change_week: market.changeWeek,
        volume_week: market.volumeWeek,
        change24: market.change24,
        volume24: market.volume24,
        last_price: market.last_price
      }))

      const itemSize = 29
      const pageMode = false

      return { pageMode, itemSize, header, data }
    }

  },

  methods: {
    setMarket(market) {
      if (this.id == market.id) return

      if (!isNaN(this.id)) {
        this.$store.dispatch('market/unsubscribe', this.id)
      }

      this.$router.push(
        { name: `trade-index-id___${this.$i18n.locale}`, params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
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
            delay: 'stagger( rand(0, 100) )'
          }
        })

        const circle = this.$vuemo.Shape({
          left: 0,
          top: 0,
          radius: { 0: 16, easing: 'sin.out' },
          fill: 'none',
          stroke: 'white',
          strokeWidth: { 10: 0 },
          duration: 450,
          easing: 'cubic.out'
        })
        burst
          .tune({
            x: e.clientX - width / 2 + 8,
            y: e.clientY - height / 2
          })
          .setSpeed(3)
          .replay()

        circle
          .tune({
            x: e.clientX - width / 2 + 8,
            y: e.clientY - height / 2
          })
          .replay()
        this.$store.commit(
          'settings/setFavMarkets',
          this.favMarkets.concat([id])
        )
      }
    }
  }
}
</script>

<style lang="scss">
.markets-bar {
  .vue-recycle-scroller {
    background-color: var(--bg-big-card);
  }
}

.mobile-close {
  cursor: pointer;

  i {
    right: 7px;
    position: absolute;
    top: 6px;
    font-size: 16px;
  }
}

.time-sale {
  .mobile-close {
    display: none;
  }
}

.markets-bar {
  background-color: var(--table-background) !important;

  .el-input__inner {
    background-color: var(--background-color-base) !important;

    @media screen and (max-width: 767px) {
      // prevent zoomin in mobile devices
      font-size: 16px !important;
    }
  }
}

.markets-bar .el-table {

  th {
    background: var(--table-header-background);
  }

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

.markets-bar {
  height: 100%;
  z-index: 3;
  margin-top: 0 !important;
  padding-top: 2px;

  .el-table--fit {
    height: calc(100% - 70px);
    margin-top: 10px;

  }

  .el-table__body-wrapper {
    height: calc(100% - 45px);
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.markets-bar .el-table .active-row {
  background: var(--btn-active);
}

.market-table-row.active-row {
  background-color: var(--btn-active);
}

.market-table * {
  font-size: 12px;
}

.market-table tr.header {
  padding: 5px;
}

.market-table th.header__column span {
  color: var(--text-grey-thirdly);
}

.market-table .market-table-row {
  color: var(--text-secondary);
}


.market-table-row {
  cursor: pointer;
  display: flex;
  gap: 4px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--bg-alter-1);
}

.market-table-row:hover {
  background-color: var(--bg-alter-1);
}

.market-table-row * {
  font-size: 11px;
}

.pair-name,
.pair-price,
.pair-volume {
  display: flex;
  align-items: center;
}

.pair-name {
  width: 50%;
  gap: 2px;
}

.market-table-row * {
  line-height: 11px;
}

.pair-price {
  width: 25%;
  text-align: left;
  justify-content: start;
}

.pair-volume {
  width: 25%;
  text-align: right;
  justify-content: end;
}
</style>
