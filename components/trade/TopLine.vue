<template lang="pug">
client-only
  .trade-top-line
    markets.markets(v-if='showMarkets', v-click-outside='onClickOutside' @close="showMarkets = false")

    .d-flex.align-items-center.header-items-container.pl-3
      .d-flex.flex-column.pointer(@click='showMarkets = !showMarkets').pr-0
        .d-flex.align-items-center.show-markets
          TokenImage(:src='$tokenLogo(quote_token.symbol.name, quote_token.contract)' height='20').mr-2
          .weight-700.token-name {{ quote_token.symbol.name }} / {{ base_token.symbol.name }}
          i.el-icon-caret-bottom.ml-1.text-muted

      .d-flex.flex-column
        .text-grey
          a.text-muted(:href='monitorAccount(quote_token.contract)', target='_blank')
            u {{ quote_token.contract }}

          //i.el-icon-question.ml-2
          //img(src="~/assets/icons/question.svg").ml-2


      .d-flex.flex-column
        div(:class="stats.change24 > 0 ? 'green' : 'red'") {{ price }} &nbsp;
        div(v-if="base_token.contract == network.baseToken.contract") $ {{ $systemToUSD(price, 8) }}

      .d-flex.flex-column(v-if="header_settings.change_24")
        span.text-grey {{ $t('Change 24H') }}
        change-percent(:change='stats.change24')
      .d-flex.flex-column(v-if="header_settings.volume_24")
        span.text-grey {{ $t('Volume 24H:') }}
        span {{ stats.volume24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.high_24")
        span.text-grey {{ $t('24H High:') }}
        span {{ stats.high24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.low_24")
        span.text-grey {{ $t('24H Low:') }}
        span {{ stats.low24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.volume_24_usd & base_token.contract == network.baseToken.contract")
        span.text-grey {{ $t('24H USD:') }}
        span $ {{ $systemToUSD(stats.volume24) }}
      .d-flex.flex-column(v-if="header_settings.weekly_volume")
        span.text-grey {{ $t('Weekly Volume (WAX / USD):') }}

        span {{ stats.volumeWeek | commaFloat(2) }} {{ base_token.symbol.name }}
          span(v-if="base_token.contract == network.baseToken.contract")  / $ {{ $systemToUSD(stats.volumeWeek) }}

        //.d-flex.flex-column(v-if="header_settings.all_time")
          span.text-muted {{ $t('All Time High/Low:') }}
          span {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}

    //.d-flex.align-items-center.header-items-container.pl-3
      .d-flex.flex-column
        .arrow.ml-3.mr-2.d-flex.justify-content-center.align-items-center(:style="{cursor: 'pointer'}" @click='arrowClickfunc' v-if="!isMobile & showArrow")
          i.el-icon-right(v-if="arrowRight")
          i.el-icon-back(v-else)

        .pointer.ml-3.pr-4
          i.el-icon-star-off(
            :class='{ "el-icon-star-on": isFavorite }',
            @click='toggleFav'
          )
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import Withdraw from '~/components/withdraw/Withdraw'
import Markets from '~/components/trade/Markets'


export default {
  components: {
    TokenImage,
    ChangePercent,
    Withdraw,
    Markets
  },

  mounted() {
    this.setArrow()
  },

  data() {
    return {
      showMarkets: false,
      showArrow: false,
      arrowRight: true
    }
  },

  watch: {
    header_settings: {
      handler(val) {
        this.setArrow()
      },
      deep: true
    },

    id() {
      this.showMarkets = false
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['stats', 'base_token', 'quote_token', 'id', 'header_settings']),
    ...mapState('settings', ['favMarkets']),
    ...mapGetters('market', ['price']),

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    },
  },

  methods: {
    setArrow() {
      setTimeout(() => {
        if (document.getElementsByClassName('header-items-container')[0].scrollWidth > 560) {
          this.showArrow = true
        } else {
          this.showArrow = false
        }
      }, 100)
    },

    arrowClickfunc() {
      if (this.arrowRight)
        document.getElementsByClassName('header-items-container')[0].scrollLeft = document.getElementsByClassName('header-items-container')[0].scrollWidth
      else
        document.getElementsByClassName('header-items-container')[0].scrollLeft = 0
      this.arrowRight = !this.arrowRight
    },
    onClickOutside(event) {
      if (this.showMarkets) {
        this.showMarkets = false
      }
    },
    toggleFav() {
      if (this.isFavorite) {
        this.$store.commit(
          'settings/setFavMarkets',
          this.favMarkets.filter((m) => m != this.id)
        )
      } else {
        this.$store.commit(
          'settings/setFavMarkets',
          this.favMarkets.concat([this.id])
        )
      }
    },
  },
}
</script>

<style scoped lang="scss">
.show-markets {
  cursor: pointer;

  :hover {
    color: #6c757d;
  }
}

.header-items-container {
  overflow: auto;

  .token-name {
    font-size: 14px;
  }

  .flex-column {
    margin-right: 20px;
    flex-shrink: 0;
  }
}

.header-items-container::-webkit-scrollbar {
  display: none;
}

.desktop {
  height: 54px;
  font-size: 14px;

  i {
    font-size: 17px;
  }
}

.items {
  >* {
    padding: 2px;
  }
}

.markets {
  width: 360px;
  position: absolute;
  top: 30px;
  background: #282828;
  border: 2px solid rgb(63, 63, 63);
  border-radius: 2px;
}

.arrow {
  background-color: #333333;
  border-radius: 50%;
  width: 22px;
  height: 22px;
}
</style>

<style lang="scss">
.header-items-container {
  height: 50px;
  display: flex;
}

.trade-top-line {
  margin-bottom: 2px;

  font-weight: 400;
  font-size: 12px;

  background: var(--background-color-base);
  border-bottom: 1px solid var(--border-color);
}
</style>
