<template lang="pug">
.wrapper(@click="redirect" :class="{ 'mobile': isMobile }")
  .label
    token-image.token(:src='$tokenLogo(item.quote_name, item.contract)')
    .name
      span {{ item.quote_name }}
      .text-muted(v-if='!isMobile') {{ item.contract }}
      span /
      span {{ item.base_name }}
      span.promo-label(v-if="isMobile && item.promoted") top
  .promoted
    img(v-if="!isMobile && item.promoted" src="~/assets/icons/badge-promoted.svg")
  .last-price(:class="{ down: item.change24 < 0 }")
    span(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") ${{ $systemToUSD(item.last_price, 8, 2, item.base_name == 'USDT') }}
    span(v-else)
      span {{ item.last_price }}
      span(v-if="!isMobile")
        |  {{ item.base_name }}
  .day-vol(v-if='!isMobile')
    span.text-mutted(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") ${{ $systemToUSD(item.volume24) }}
    span.text-mutted(v-else) {{ item.volume24.toFixed(2) | commaFloat }} {{ item.base_name }}
  .day-change(v-if='!isMobile')
    change-percent(:change='item.change24')
  .week-vol
    span.text-mutted(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") ${{ $systemToUSD(item.volume_week) }}
    span.text-mutted(v-else)
      | {{ item.volume_week.toFixed(2) | commaFloat }}
      span(v-if="!isMobile")
        |  {{ item.base_name }}
  .week-change(v-if='!isMobile')
    change-percent(:change='item.change_week')
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: { TokenImage, ChangePercent },
  props: ['item', 'showVolumeInUSD', 'marketsActiveTab'],
  computed: {
    ...mapState(['network'])
  },
  methods: {
    redirect() {
      this.$router.push({
        name: `trade-index-id___${this.$i18n.locale}`,
        params: { id: this.item.slug }
      })
    }
  }
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
}

.wrapper:hover {
  background-color: var(--background-color-base);
}

.wrapper .label {
  display: flex;
  align-items: center;
}

.wrapper.mobile .token {
  width: 16px;
  height: 16px;
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
