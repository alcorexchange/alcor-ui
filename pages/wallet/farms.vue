<template lang="pug">
.wallet-farms
  WalletFarmHeader(title="Your Owned Farms")
    template(#start)
      el-input(placeholder="Search by token name or address" class="search-input")
    template(#end)
      AlcorLink(to="/farms/create" class="create-farm")
        i.el-icon-circle-plus-outline
        span Create Farm

  FarmsOwnedTable(class="mt-2")

  WalletFarmHeader(title="Your Staked Farms" class="mt-5")

  FarmsTable(class="mt-2" :noClaim="true")
</template>

<script>
import WalletFarmHeader from '~/components/wallet/WalletFarmHeader.vue'
import FarmsOwnedTable from '~/components/farm/FarmsOwnedTable.vue'
import FarmsTable from '~/components/farm/FarmsTable.vue'
import AlcorLink from '~/components/AlcorLink.vue'
export default {
  name: 'WalletFarms',
  components: {
    WalletFarmHeader,
    AlcorLink,
    FarmsOwnedTable,
    FarmsTable,
  },
  data: () => ({}),
}
</script>

<style scoped lang="scss">
.create-farm {
  &::v-deep {
    background: var(--main-action-green);
    color: black;
    &:hover {
      color: var(--main-action-green);
    }
  }
}
</style>
