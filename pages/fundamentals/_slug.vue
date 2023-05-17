<template lang="pug">
.fund
  .fund__back.disable.pointer
    i(class="el-icon-back")
    span(@click="$router.go(-1)") {{ $t('Return') }}
  .fund__title {{ $t('Token Fundamentals') }}
  .fund__header
    .column
      .label.disable {{ $t('Full Name') }}
      .value(v-if="(fundamental && fundamental.name) || currentMarket")
        TokenImage(:src='$tokenLogo($route.params.slug.split(`@`)[0], $route.params.slug.split(`@`)[1])')
        span(v-if="fundamental && fundamental.name") {{ fundamental.name }}
        span(v-else) --
    .column
      .label.disable {{ $t('Price') }}
      .value(v-if="currentMarket") {{ currentMarket.last_price.toFixed(5) }} WAX
    .actions
      el-dropdown(v-if="fundamental && fundamental.socials" trigger="click")
        el-button {{ $t('Socials') }}
          i(class="el-icon-arrow-down el-icon--right")
        el-dropdown-menu(slot="dropdown")
          el-dropdown-item(v-for="social in fundamental.socials" :key="social")
            a.link.disable(:href="social") {{ social }}

      swap-button.swap-button(v-if="relatedPool && currentMarket.base_token.symbol.name" :pool="relatedPool.id")
        | {{ $t('SWAP') }} ({{ relatedPool.rate }} {{ currentMarket.base_token.symbol.name }})

      el-dropdown(trigger="click" v-if="contractMarkets.length")
        el-button {{ $t('Markets') }}
          i(class="el-icon-arrow-down el-icon--right")
        el-dropdown-menu(slot="dropdown")
          el-dropdown-item(v-for="market in contractMarkets" :key="market")
            .market(@click="() => $router.push({ name: `trade-index-id___${$i18n.locale}`, params: { id: market.slug } })")
              .market__name
                token-image(:src='$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)')
                .token-name  {{ market.quote_token.symbol.name }} / {{ market.base_token.symbol.name }}
              .market__price {{ market.last_price.toFixed(5) }}

  .fund__info
    .column
      .label.disable
        img(src="~/assets/icons/ticker.svg")
        span {{ $t('Ticker Name') }}
      .value.bold {{ $route.params.slug.split(`@`)[0] }}
    .column
      .label.disable
        img(src="~/assets/icons/listing-time.svg")
        span {{ $t('Listing time') }}
      .value.bold 21/03/2022 10:00PM
    .column
      .label.disable
        img(src="~/assets/icons/contract.svg")
        span {{ $t('Contract') }}
      a.value.link(v-if="currentMarket" :href='monitorAccount(currentMarket.quote_token.contract)', target='_blank') {{ currentMarket.quote_token.contract }}

    .column
      .label.disable
        img(src="~/assets/icons/website.svg")
        span {{ $t('Website') }}
      a.value.link(v-if="fundamental && fundamental.website" :href="fundamental.website.link") {{ fundamental.website.name }}
      span.value(v-else) --
    .column
      .label.disable
        img(src="~/assets/icons/source-code.svg")
        span {{ $t('Source Code') }}
      a.value.link(v-if="fundamental && fundamental.github" :href="fundamental.github")
        img(src='~/assets/icons/gh.svg')
        span Github
      span.value(v-else) --

  .fund__advance
    .list-tags
      .title.disable
        img(src='~/assets/icons/tag.svg')
        span {{ $t('Listing Tags') }}
      .tags(v-if="fundamental && fundamental.tags")
        .tag(v-for="tag in fundamental.tags") {{ tag }}
      span.value(v-else) --

    .column
      .stat
        .title.disable
          span {{ $t('Fully Diluted Market Cap') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t('The market cap if the max supply was in circulation') }}.
                p {{ $t('Fully-diluted market cap (FDMC) = price x max supply. If max supply is null, FDMC = price x total supply. if max supply and total supply are infinite or not available, fully-diluted market cap shows - -') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value(v-if="stat && stat.supply && currentMarket")
          span.bold {{ (parseInt(stat.supply) * currentMarket.last_price).toFixed(5) }} WAX
          span.green  (${{ $systemToUSD(parseInt(stat.max_supply) * currentMarket.last_price) }} )

      .stat
        .title.disable
          span {{ $t('Market Cap') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t("The total market value of a cryptocurrency's circulating supply.It is analogous to the free - float capitalization in the stock market") }}.
                p {{ $t('Market Cap = Current Price x Circulating Supply') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value(v-if="stat && stat.supply && currentMarket")
          span.bold {{ (parseInt(stat.supply) * currentMarket.last_price).toFixed(5) }} WAX
          span.green  (${{ $systemToUSD(parseInt(stat.supply) * currentMarket.last_price) }} )

      .stat
        .title.disable
          span {{ $t('Volume 24h') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t('A measure of how much of a cryptocurrency was traded in the last 24 hours') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value
          span.bold {{ contractDayVolume.toFixed(5) }} WAX
          span.green  (${{ $systemToUSD(contractDayVolume) }})

    .column
      .stat
        .title.disable
          span {{ $t('Circulating Supply') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t('The amount of coins that are circulating in the market and are in public hands. It is analogous to the flowing shares in the stock market') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value(v-if="stat && stat.supply")
          span.bold {{ stat.supply }}

      .stat
        .title.disable
          span {{ $t('Max Supply') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t('The maximum amount of coins that will ever exist in the lifetime of the cryptocurrency. It is analogous to the fully diluted shares in the stock market') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value(v-if="stat && stat.max_supply")
          span.bold {{ stat.max_supply }}

      .stat
        .title.disable
          span {{ $t('Total Supply') }}
          el-popover(placement='bottom-start' width='300' trigger='hover')
            template
              .text
                p {{ $t('The amount of coins that have been already created, minus any coins that have been burned. It is analogous to the outstanding shares in the stock market') }}.
            .el-icon-info(slot="reference").ml-2.pointer

        .value(v-if="stat && stat.max_supply")
          span.bold {{ stat.max_supply }}
  preview-chart(v-if="currentMarket" :blank="true")
    #fund__chart

  .fund__description(v-if="fundamental && fundamental.description")
    .title.disable {{ $t('Description') }}
    .text {{ fundamental.description }}

</template>

<script>
import { mapState, mapGetters } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import SwapButton from '~/components/trade/SwapButton'
import PreviewChart from '~/components/trade/Chart.vue'

export default {
  components: { TokenImage, SwapButton, PreviewChart },
  data: () => ({ stat: null }),
  computed: {
    ...mapState(['markets']),
    ...mapGetters('market', ['relatedPool']),
    ...mapState(['network']),
    contractMarkets() {
      return this.markets.filter(
        (market) =>
          market.quote_token.contract == this.$route.params.slug.split('@')[1]
      )
    },
    contractDayVolume() {
      return this.contractMarkets.reduce(
        (sum, { volume24 }) => sum + volume24,
        0
      )
    },
    currentMarket() {
      return this.contractMarkets.find(
        ({ quote_token }) =>
          quote_token.symbol.name === this.$route.params.slug.split('@')[0]
      )
    },

    fundamental() {
      console.log('this.$fundamentals', this.$fundamentals)
      if (!this.$fundamentals[this.$store.state.network.name]) return null

      return this.$fundamentals[this.$store.state.network.name][
        this.$route.params.slug
      ]
    }
  },
  watch: {
    currentMarket(market) {
      this.$store.dispatch('market/setMarket', market)
    }
  },
  mounted() {
    const [scope, contract] = this.$route.params.slug.split('@')
    this.$rpc
      .get_table_rows({
        code: contract,
        table: 'stat',
        limit: 1,
        scope
      })
      .then(({ rows }) => (this.stat = rows[0]))
      .catch((e) => console.error('fetchDataError', e))
  }
}
</script>

<style scoped lang="scss">
.disable {
  color: var(--text-disable);
}

.green {
  color: var(--main-green);
}

.market,
.market__name {
  display: flex;
  gap: 10px;
}

.fund {
  &__back {
    display: flex;
    gap: 4px;
    align-items: center;
    margin-top: 24px;

    span:hover {
      text-decoration: underline;
    }
  }

  &__title {
    font-size: 25px;
    margin-top: 12px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    margin-top: 40px;

    @media only screen and (max-width: 600px) {
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .label {
      font-size: 20px;

      @media only screen and (max-width: 600px) {
        font-size: 14px;
      }
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 16px;

      @media only screen and (max-width: 600px) {
        gap: 8px;
      }
    }

    .value {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 34px;

      @media only screen and (max-width: 600px) {
        font-size: 18px;

        img {
          height: 18px;
        }
      }
    }

    .actions {
      display: flex;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }

    .link {
      text-decoration: none;
    }
  }

  &__info {
    margin-top: 64px;
    display: flex;
    justify-content: space-between;
    padding: 16px;
    background-color: var(--background-color-third);
    border-radius: 8px;

    @media only screen and (max-width: 600px) {
      margin-top: 32px;
      flex-direction: column;
      gap: 32px;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 8px;

      @media only screen and (max-width: 600px) {
        gap: 0px;
      }
    }

    .label {
      display: flex;
      gap: 10px;
      align-items: center;

      img {
        height: 14px;
      }
    }

    .bold {
      font-weight: 700;
    }

    .value {
      display: flex;
      gap: 8px;
      font-size: 20px;
    }

    .link {
      text-decoration: underline !important;
      cursor: pointer;
      font-weight: 700;
      color: #80a1c5;
    }
  }

  &__advance {
    margin-top: 32px;
    display: flex;
    justify-content: flex-start;
    gap: 36px;

    @media only screen and (max-width: 600px) {
      flex-direction: column;
    }

    .list-tags {
      border-radius: 8px;
      padding: 18px;
      background-color: var(--background-color-third);
      width: 265px;
      height: 182px;
    }

    .title {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tags {
      margin-top: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      background-color: var(--btn-active);
      padding: 8px 16px;
      border-radius: 8px;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bold {
      font-weight: 600;
      font-size: 18px;
      color: var(--text-default);
    }
  }

  #fund__chart {
    margin-top: 64px;
    height: 550px;

    @media only screen and (max-width: 600px) {
      margin-top: 32px;
    }
  }

  &__description {
    margin-top: 64px;

    @media only screen and (max-width: 600px) {
      margin-top: 32px;
    }
  }
}
</style>
