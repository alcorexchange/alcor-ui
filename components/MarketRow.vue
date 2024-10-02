<template lang="pug">
NuxtLink.wrapper(:to="localeRoute(`/trade/${item.slug}`)" :class="{ 'mobile': isMobile }")
  .label
    PairIcons(
      v-if="isUSDTbase"
      :size="isMobile ? '16' : undefined"
      :token1="{ symbol: item.quote_name, contract: item.contract }"
      :token2="{ symbol: item.base_name, contract: item.base_contract }")

    TokenInfoImage(v-else :symbol="item.quote_name" :contract="item.contract" :height="isMobile ? '16' : undefined")

    .name
      span {{ item.quote_name }}
      .text-muted(v-if='!isMobile') {{ item.contract }}
      span /
      span {{ item.base_name }}
      span.promo-label(v-if="isMobile && item.promoted") top
  .promoted
    img(v-if="!isMobile && item.promoted" src="~/assets/icons/badge-promoted.svg")
  .last-price(:class="{ down: item.change24 < 0 }")
    span(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") $ {{ $systemToUSD(item.last_price, 8, 8, item.base_name == 'USDT') }}
    span(v-else)
      span {{ item.last_price }}
      span(v-if="!isMobile")
        |  {{ item.base_name }}
  .day-vol(v-if='!isMobile')
    span.text-mutted(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") $ {{ $systemToUSD(item.volume24, 2, 2, item.base_name == 'USDT') }}
    span.text-mutted(v-else) {{ item.volume24.toFixed(2) | commaFloat }} {{ item.base_name }}
  .day-change(v-if='!isMobile')
    change-percent(:change='item.change24')
  .week-vol
    span.text-mutted(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") $ {{ $systemToUSD(item.volume_week, 2, 2, item.base_name == 'USDT') }}
    span.text-mutted(v-else)
      | {{ item.volume_week.toFixed(2) | commaFloat }}
      span(v-if="!isMobile")
        |  {{ item.base_name }}
  .week-change(v-if='!isMobile')
    change-percent(:change='item.change_week')
</template>

<script>
import { mapState } from 'vuex'
import TokenInfoImage from '~/components/elements/TokenInfoImage'
import ChangePercent from '~/components/trade/ChangePercent'
import PairIcons from '~/components/PairIcons'

export default {
  components: { TokenInfoImage, ChangePercent, PairIcons },
  props: ['item', 'showVolumeInUSD', 'marketsActiveTab'],
  computed: {
    ...mapState(['network']),

    isUSDTbase() {
      return true
      //return this.network.USD_TOKEN.includes(this.item.base_contract)
    },
  },
  methods: {
    redirect() {
      this.$router.push({
        name: `trade-index-id___${this.$i18n.locale}`,
        params: { id: this.item.slug },
      })
    },
  },
}
</script>

<style scoped>
.wrapper {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  font-size: 14px;
  gap: 10px;
  border-bottom: 1px solid var(--background-color-base);
  cursor: pointer;
  color: inherit;
}

.wrapper:hover {
  background-color: var(--background-color-base);
}

.wrapper .label {
  display: flex;
  align-items: center;
}

.wrapper.mobile {
  padding: 20px 10px;
  gap: 5px;
}

.wrapper.mobile {
  font-size: 11px;
  text-align: right;
}

.wrapper.mobile > .last-price,
.wrapper.mobile > .week-vol {
  width: 33%;
}

.wrapper.mobile > .label,
.wrapper.mobile > .promoted {
  width: 16%;
}

.label {
  gap: 16px;
  width: 250px;
  justify-content: start;
}

.mobile .label {
  gap: 8px;
}

.promoted {
  width: 75px;
}

.last-price,
.day-vol,
.week-vol {
  display: flex;
  justify-content: flex-end;
  width: 190px;
}

.week-change,
.day-change {
  display: flex;
  justify-content: flex-end;
  width: 100px;
}

.name {
  display: flex;
  gap: 0.3rem;
  position: relative;
}

.name .link:hover {
  text-decoration: underline !important;
}

.promo-label {
  color: #1fc781;
  border: 1px solid #66c167;
  border-radius: 4px;
  padding: 0 4px;
  position: absolute;
  font-size: 10px;
  text-transform: uppercase;

  right: -35px;
  top: -14px;
}

.last-price {
  color: var(--main-green);
}

.last-price.down {
  color: var(--main-red);
}
.last-price span {
  text-align: right;
}
</style>
