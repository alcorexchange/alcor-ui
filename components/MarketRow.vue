<template lang="pug">
.wrapper(@click="redirect" :class="{ 'mobile': isMobile }")
  .label
    token-image.token(:src='$tokenLogo(item.quote_name, item.contract)')
    .name
      span {{ item.quote_name }}
      a.link.text-muted(v-if='!isMobile' :href='monitorAccount(item.contract)', target='_blank') {{ item.contract }}
      span /
      span {{ item.base_name }}
  .promoted
    img(v-if="!isMobile && item.promoted" src="~/assets/icons/badge-promoted.svg")
  .last-price
    span.text-success(v-if="showVolumeInUSD && marketsActiveTab == network.baseToken.symbol") ${{ $systemToUSD(item.last_price, 8) }}
    span.text-success(v-else)
      | {{ item.last_price }}
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
      this.$router.push({ name: 'trade-index-id', params: { id: this.item.slug } })
    }
  }
}
</script>

<style scoped>
.wrapper {
  display: flex;
  padding: 15px 20px;
  font-size: 14px;
  gap: 10px;
  border-bottom: 1px solid #282828;
  cursor: pointer;
}

.wrapper:hover {
  background-color: #282828;
}

.wrapper>* {
  display: flex;
  align-items: center;
  justify-content: end;
}

.wrapper.mobile .token {
  width: 16px;
  height: 16px;
}

.wrapper.mobile {
  padding: 15px 10px;
  gap: 5px;
}

.wrapper.mobile {
  font-size: 11px;
  text-align: right;
}

.wrapper.mobile>.last-price,
.wrapper.mobile>.week-vol {
  width: 33% !important;
}

.wrapper.mobile>.label,
.wrapper.mobile>.promoted {
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
  justify-content: end;
  width: 190px;
}

.week-change,
.day-change {
  width: 100px;
}

.name {
  display: flex;
  gap: .3rem;
}

.name .link:hover {
  text-decoration: underline !important;
}
</style>
