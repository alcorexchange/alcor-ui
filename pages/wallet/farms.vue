<template lang="pug">
.wallet-farms
  WalletFarmHeader(title="Your Owned Farms")
    template(#start)
      el-input(placeholder="Search by token name or address" class="search-input")
    template(#end)
      AlcorLink(to="/farms/create" class="create-farm")
        i.el-icon-circle-plus-outline
        span Create Farm
</template>

<script>
import WalletFarmHeader from '~/components/wallet/WalletFarmHeader.vue'
import AlcorLink from '~/components/AlcorLink.vue'
export default {
  name: 'WalletFarms',
  components: {
    WalletFarmHeader,
    AlcorLink,
  },
  data: () => ({}),
}
</script>

<style scoped lang="scss">
.create-farm {
  &::v-deep {
    background: var(--main-green);
    color: black;
    &:hover {
      color: var(--main-green);
    }
  }
}
</style>
