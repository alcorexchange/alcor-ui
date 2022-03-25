<template lang="pug">
client-only
  .box-card.pl-3.pt-2
    .row
      .col
        .d-flex.align-items-center.desktop(v-if='!isMobile')
          .d-flex.flex-column.justify-content-center
            .d-flex.align-items-center.cursor-pointer.show-markets(
              @click='showMarkets = !showMarkets'
            )
              TokenImage.show-markets(
                :src='$tokenLogo(quote_token.symbol.name, quote_token.contract)',
                height='20'
              )
              .d-flex.ml-2.symbol.show-markets
                b.show-markets {{ quote_token.symbol.name }}
                span.ml-1.show-markets / {{ base_token.symbol.name }}
            a.text-muted(
              :href='monitorAccount(quote_token.contract)',
              target='_blank'
            ) {{ quote_token.contract }}
          markets.markets(v-if='showMarkets', v-click-outside='onClickOutside')
          //.d-flex.ml-3(v-if="hasWithdraw")
            // TODO Token prop & mobile version
            Withdraw(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

          //.d-flex.ml-3(v-if="$store.state.ibcTokens.includes(quote_token.contract)")
            // TODO Token prop & mobile version
            BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}")

          //.d-flex.ml-3.w-100.justify-content-around.desctop
          .d-flex.align-items-center.ml-3.small
            .d-flex.flex-column.ml-3.mr-3
              span.text-muted Change 24H
              change-percent(:change='stats.change24')
            .d-flex.flex-column.ml-3.mr-3
              span.text-muted Volume 24H:
              span {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
            .d-flex.flex-column.ml-3.mr-3
              span.text-muted 24H High:
              span {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
            .d-flex.flex-column.ml-3.mr-3
              span.text-muted 24H Low:
              span {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
            .arrow.ml-3.mr-2.d-flex.justify-content-center.align-items-center
              i.el-icon-right(:class='{ "el-icon-left": false }')
            .pointer.ml-3.mr-2
              i.el-icon-star-off(
                :class='{ "el-icon-star-on": isFavorite }',
                @click='toggleFav'
              )
              //i.el-icon-star-off.ml-2
        div(v-else)
          .overflowbox.items
            .row.align-items-center(
              v-if='base_token.symbol.name == network.baseToken.symbol && base_token.contract == network.baseToken.contract'
            )
              .col-2
                TokenImage.ml-2(
                  :src='$tokenLogo(quote_token.symbol.name, quote_token.contract)',
                  height='30'
                )
              .col-10
                .d-flex.ml-2
                  b {{ quote_token.symbol.name }}@
                  a(
                    :href='monitorAccount(quote_token.contract)',
                    target='_blank'
                  ) {{ quote_token.contract }}

            .row.align-items-center(v-else)
              .col-2
                TokenImage.ml-2(
                  :src='$tokenLogo(base_token.symbol.name, base_token.contract)',
                  height='30'
                )
              .col-10
                .d-flex.ml-2
                  b {{ base_token.symbol.name }}@
                  a(:href='monitorAccount(base_token.contract)', target='_blank') {{ base_token.contract }}
            .row
              .col
                .d-flex.ml-2
                  span Change 24H:
                  change-percent.ml-2(:change='stats.change24')
            .row
              .col
                .d-flex.ml-2
                  span Volume 24H:
                  span.text-success.ml-1 {{ stats.volume24.toFixed(2) }} {{ base_token.symbol.name }}
                  .pointer.ml-2
                    i.el-icon-star-off(
                      :class='{ "el-icon-star-on": isFavorite }',
                      @click='toggleFav'
                    )
            .row
              .col.ml-3
                Withdraw(
                  :token='{ contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision }',
                  v-if='hasWithdraw'
                )
                //BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}" v-if="quote_token.contract == 'bosibc.io'")
</template>

<script>
import { mapState } from 'vuex'
import Vue from 'vue'

Vue.directive('click-outside', {
  bind(el, binding, vnode) {
    el.clickOutsideEvent = (event) => {
      if (
        !(
          el === event.target ||
          el.contains(event.target) ||
          event.target.className.includes('show-markets')
        )
      ) {
        vnode.context[binding.expression](event)
      }
    }
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unbind(el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
})

import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'
import Withdraw from '~/components/withdraw/Withdraw'
import Markets from '~/components/trade/Markets'

//import BOSIbc from '~/components/withdraw/BOSIbc'

export default {
  components: {
    TokenImage,
    ChangePercent,
    Withdraw,
    Markets,
    //BOSIbc
  },

  data() {
    return {
      showMarkets: false,
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['stats', 'base_token', 'quote_token', 'id']),
    ...mapState('settings', ['favMarkets']),

    hasWithdraw() {
      return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    },

    isFavorite() {
      return this.favMarkets.includes(this.id)
    },
  },

  methods: {
    onClickOutside(event) {
      console.log(event)
      if (this.showMarkets) {
        console.log(event)
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
.desktop {
  font-size: 14px;

  i {
    font-size: 17px;
  }
}

.desctop span {
  font-size: 10px;
  padding-right: 10px;
}
.items {
  > * {
    padding: 2px;
  }
}

.markets {
  position: fixed;
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
