<template lang="pug">
client-only
  .trade-top-line
    markets.markets(v-if='showMarkets', v-click-outside='onClickOutside' @close="showMarkets = false")

    .d-flex.align-items-center.header-items-container.pl-3.start(ref="panel")
      .d-flex.flex-column.pointer(@click='showMarkets = !showMarkets').pr-0
        .d-flex.align-items-center.show-markets
          TokenImage(:src='$tokenLogo(quote_token.symbol.name, quote_token.contract)' height='20').mr-2
          .weight-700.token-name {{ quote_token.symbol.name }} / {{ base_token.symbol.name }}
          i.el-icon-caret-bottom.ml-1.text-muted

      .d-flex.flex-column
        .text-grey
          .contract-info(:href='monitorAccount(quote_token.contract)', target='_blank')
            a.underline(:href='monitorAccount(quote_token.contract)', target='_blank') {{ quote_token.contract }}
            el-dropdown(placement="bottom")
              nuxt-link.token-info(:to="{ name: `fundamentals-slug___${$i18n.locale}`, params: { slug: `${quote_token.symbol.name}@${quote_token.contract}` } }") ?
              el-dropdown-menu(slot='dropdown')
                .token-info-box
                  .info-box-row
                    .key.cancel {{ $t('Full Name') }}
                    .value(v-if="fundamental && fundamental.name")
                      token-image(:src='$tokenLogo(quote_token.symbol.name, quote_token.contract)')
                      span {{ fundamental.name }}
                    .value(v-else) --
                  .info-box-row
                    .key.cancel {{ $t('Listing time') }}
                    .value 21/03/2022 10:00PM
                  .info-box-row(v-if="stat && stat.supply")
                    .key.cancel {{ $t('Circulating Supply') }}
                    .value {{ stat.supply }}
                  .info-box-row
                    .key.cancel {{ $t('Website') }}
                    a.value.link(v-if="fundamental && fundamental.website" :href="fundamental.website.link") {{ fundamental.website.name }}
                    .value(v-else) --
                  .info-box-row
                    .key.cancel {{ $t('Socials') }}
                    .soc-links(v-if="fundamental && fundamental.socials")
                      a.link(v-for="social in fundamental.socials" :href="social") {{ social }}
                    .value(v-else) --
                  .info-box-row
                    .key.cancel {{ $t('Description') }}
                    .value(v-if="fundamental && fundamental.description") {{ fundamental.description }}
                    .value(v-else) --

          //i.el-icon-question.ml-2
          //img(src="~/assets/icons/question.svg").ml-2


      .d-flex.flex-column
        div(:class="stats.change24 > 0 ? 'green' : 'red'") {{ price }} &nbsp;
        div(v-if="base_token.contract == network.baseToken.contract") $ {{ $systemToUSD(price, 8) }}

      .d-flex.flex-column(v-if="header_settings.change_24")
        span.text-grey {{ $t('Change 24H') }}
        change-percent(:change='stats.change24')
      .d-flex.flex-column(v-if="header_settings.volume_24")
        span.text-grey {{ $t('Volume 24H') }}:
        span {{ stats.volume24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.high_24")
        span.text-grey {{ $t('24H High') }}:
        span {{ stats.high24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.low_24")
        span.text-grey {{ $t('24H Low') }}:
        span {{ stats.low24.toFixed(2) | commaFloat }} {{ base_token.symbol.name }}
      .d-flex.flex-column(v-if="header_settings.volume_24_usd & base_token.contract == network.baseToken.contract")
        span.text-grey {{ $t('24H USD') }}:
        span $ {{ $systemToUSD(stats.volume24) }}
      .d-flex.flex-column(v-if="header_settings.weekly_volume")
        span.text-grey {{ $t('Weekly Volume (WAX / USD)') }}:

        span {{ stats.volumeWeek | commaFloat(2) }} {{ base_token.symbol.name }}
          span(v-if="base_token.contract == network.baseToken.contract")  / $ {{ $systemToUSD(stats.volumeWeek) }}

        //.d-flex.flex-column(v-if="header_settings.all_time")
          span.text-muted {{ $t('All Time High/Low:') }}
          span {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}

      .arrow.d-flex.justify-content-center.align-items-center(:style="{ cursor: 'pointer' }" @click='arrowClickfunc' v-if="!isMobile & showArrow")
        i.el-icon-right(v-if="arrowRight")
        i.el-icon-back(v-else)

      .fav.pointer(@click='toggleFav')
        i.el-icon-star-off(
          :class='{ "el-icon-star-on": isFavorite }',
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
    this.$rpc.get_table_rows({
      code: this.quote_token.contract,
      table: 'stat',
      limit: 1,
      scope: this.quote_token.symbol.name
    }).then(({ rows }) => this.stat = rows[0])
      .catch((e) => console.error('fetchDataError', e))

    this.setArrow()
    this.assignClass()

    if (!this.isMobile)
      setTimeout(() => {
        this.$refs.panel.onwheel = e => {
          this.$refs.panel.scrollLeft += e.deltaY
          if (this.getInnerWidth() - this.$refs.panel.clientWidth < this.$refs.panel.scrollLeft) {
            this.$refs.panel.classList.add('end')
          } else {
            this.$refs.panel.classList.remove('end')
          }
          if (this.$refs.panel.scrollLeft == 0) {
            this.$refs.panel.classList.add('start')
            this.arrowRight = true
          } else {
            this.$refs.panel.classList.remove('start')
            this.arrowRight = false
          }
          e.preventDefault()
        }
      })
  },

  data() {
    return {
      stat: null,
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
      this.assignClass()
      this.setArrow()
      this.showMarkets = false
    },
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['stats', 'base_token', 'quote_token', 'id', 'header_settings']),
    ...mapState('settings', ['favMarkets']),
    ...mapGetters('market', ['price']),

    fundamental() {
      return this.$fundamentals[this.$store.state.network.name][this.quote_token.str]
    },

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    },
  },

  methods: {
    getInnerWidth() {
      return Array.from(this.$refs.panel.children).reduce((sumW, child) => sumW + child.clientWidth + 20, 0)
    },

    assignClass() {
      setTimeout(() => {
        if (!this.isMobile && this.getInnerWidth() > this.$refs.panel.clientWidth) {
          this.$refs.panel.classList.add('shadow')
        } else {
          this.$refs.panel.classList.remove('shadow')
          this.$refs.panel.classList.add('start')
        }
      })
    },
    setArrow() {
      setTimeout(() => {
        this.assignClass()
        if (this.$refs.panel.scrollWidth - this.$refs.panel.clientWidth === 0) {
          this.showArrow = false
        } else {
          this.showArrow = true
        }
      }, 100)
    },

    arrowClickfunc() {
      if (this.arrowRight) {
        document.getElementsByClassName('header-items-container')[0].scrollLeft = document.getElementsByClassName('header-items-container')[0].scrollWidth
        this.$refs.panel.classList.add('end')
        this.$refs.panel.classList.remove('start')
      } else {
        document.getElementsByClassName('header-items-container')[0].scrollLeft = 0
        this.$refs.panel.classList.add('start')
        this.$refs.panel.classList.remove('end')
      }
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
.green {
  color: var(--color-primary);
}

.red {
  color: var(--color-secondary);
}

.show-markets {
  cursor: pointer;

  :hover {
    color: #6c757d;
  }
}

.header-items-container {
  overflow: hidden;

  @media only screen and (max-width: 1175px) {
    overflow: scroll;
  }

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
  border: var(--border-2);
  border-radius: 2px;
}

.mobile-trade-inner .markets {
  top: 50px;
  left: 0px;
  height: calc(100vh - 110px);
  width: 100%;
}

.arrow {
  background-color: var(--btn-default);
  width: 20px;
  height: 20px;
  position: absolute;
  top: 2px;
}

.arrow {
  right: 46px;
}

.unlim-width .arrow {
  right: 70px;
}

.fav {
  background-color: var(--btn-default);
  width: 20px;
  height: 20px;
  position: absolute;
  top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;

  @media only screen and (max-width: 1000px) {
    display: none;
  }
}

.fav {
  right: 24px;
}

.unlim-width .fav {
  right: 47px;
}

.contract-info {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--cancel);

  a.underline {
    text-decoration: underline !important;
    color: var(--cancel);
  }
}

.token-info {
  border: 0.2em solid var(--cancel);
  box-sizing: border-box;
  display: inline-block;
  text-align: center;
  font-size: 9px;
  width: 1.7em;
  height: 1.7em;
  border-radius: 50%;
  cursor: pointer;
  text-decoration: none;
  color: var(--cancel);

}

.token-info-box {
  width: 500px;
  padding: 0 10px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .info-box-row {
    display: flex;

    .key {
      width: 125px;
    }

    .value {
      width: 375px;
      gap: 2px;
      display: flex;
      align-items: center;
      gap: 8px;

      img {
        height: 16px;
      }
    }

    .soc-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 375px;
    }

    .link {
      color: #80A1C5;
      text-decoration: underline !important;
    }
  }
}
</style>

<style lang="scss">
.header-items-container {
  height: 50px;
  display: flex;
  padding-right: 75px;

  @media (min-width: 600px) {
    &.shadow::after {
      pointer-events: none;
      /* ignore clicks */
      content: "";
      position: absolute;
      z-index: 10;
      height: 50px;
      left: 0;
      top: 0;
      width: 100%;

      /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#000000+0,000000+50,000000+50,000000+100&1+0,0+50,1+100 */
      background: -moz-linear-gradient(-45deg, var(--end-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--start-bg) 100%);
      /* FF3.6-15 */
      background: -webkit-linear-gradient(-45deg, var(--end-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--start-bg) 100%);
      /* Chrome10-25,Safari5.1-6 */
      background: linear-gradient(90deg, var(--end-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--start-bg) 100%);
      /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#000000', endColorstr='#000000', GradientType=1);
      /* IE6-9 fallback on horizontal gradient */

    }

    &.end::after {
      pointer-events: none;
      /* ignore clicks */
      content: "";
      position: absolute;
      z-index: 10;
      height: 50px;
      left: 0;
      top: 0;
      width: 100%;

      background: none;
    }

    &:not(.start)::before {
      pointer-events: none;
      /* ignore clicks */
      content: "";
      position: absolute;
      z-index: 10;
      height: 50px;
      left: 0;
      top: 0;
      width: 100%;

      /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#000000+0,000000+50,000000+50,000000+100&1+0,0+50,1+100 */
      background: -moz-linear-gradient(-45deg, var(--start-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--end-bg) 100%);
      /* FF3.6-15 */
      background: -webkit-linear-gradient(-45deg, var(--start-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--end-bg) 100%);
      /* Chrome10-25,Safari5.1-6 */
      background: linear-gradient(90deg, var(--start-bg) 0%, var(--end-bg) 5%, var(--end-bg) 95%, var(--end-bg) 100%);
      /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
      filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#000000', endColorstr='#000000', GradientType=1);
      /* IE6-9 fallback on horizontal gradient */
    }
  }
}

.trade-top-line {
  margin-bottom: 2px;

  font-weight: 400;
  font-size: 12px;

  background: var(--trade-bg);
  border-bottom: 1px solid var(--border-color);
}
</style>
