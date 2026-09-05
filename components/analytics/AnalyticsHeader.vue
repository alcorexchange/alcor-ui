<template lang="pug">
.analytics-header
  .left
    AlcorLink(to="/analytics/" exact flat) Overview
    //AlcorButton.wax-tools-link(v-if="$store.state.network.name == 'wax'" tag="a" href="https://grafana.waxtools.net/d/ae1f479a-9dd0-40f2-b35b-59b7fb91deac/swap-stats?orgId=2&refresh=5m" target="_blank")
      img(src="@/assets/images/waxtools.png")
      span.text WAXTools Analytics

    AlcorLink.wax-tools-link(to="/analytics/wax-tools" v-if="$store.state.network.name == 'wax'")
      img(src="@/assets/images/waxtools.png")
      span.text WAXTools Analytics
    //- AlcorLink(to="/analytics/tokens" flat) Tokens
    //- AlcorLink(to="/analytics/pools" flat) Pools
    //- AlcorLink(to="/analytics/spots" flat) Spot Pairs
    //AlcorLink(to="/analytics/wax-tools" flat) Wax Tools
  .right
    //- el-select(v-model="selectedNetwork").select
    //-   el-option(v-for="item in networks" :value="item.id" :label="item.name")
    AlcorLink(to="/swap") Swap
    AlcorLink(to="/markets") Trade on Spot
    AlcorLink(to="/positions/new") Add Liquidity
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import AlcorLink from '@/components/AlcorLink'
export default {
  name: 'AnalyticsHeader',
  components: {
    AlcorButton,
    AlcorLink,
  },
  // Accept urls and list of networks as props
  data: () => ({
    networks: [
      { name: 'All Networks', id: 1 },
      { name: 'WAX', id: 2 },
      { name: 'EOS', id: 3 },
    ],
    selectedNetwork: 1,
  }),
}
</script>

<style scoped lang="scss">
.analytics-header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.left,
.right {
  display: flex;
  gap: 10px;
}
.active {
  background: var(--btn-active) !important;
}
.select::v-deep {
  .el-input__inner {
    width: 120px;
    padding-left: 8px;
    height: 32px;
    line-height: 32px;
  }
  .el-input__suffix {
    display: flex;
    align-items: center;
  }
}
.wax-tools-link {
  img {
    height: 14px;
  }
}

@media only screen and (max-width: 800px) {
  .analytics-header {
    flex-direction: column;
  }
  .right {
    align-self: flex-end;
  }
}
</style>
