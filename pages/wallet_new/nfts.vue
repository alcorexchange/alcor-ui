<template lang="pug">
  div.nfts
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      //- TODO: Add filter
    .items
      .item-container(v-for="x in 8")
        NftCard
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import NftCard from '@/components/wallet/NftCard'
export default {
  name: 'NFTs',
  components: {
    NftCard
  },
  data: () => ({
    search: '',
    mock: [
      {
        pair: 'TLM/WAX',
        id: 'alien.worlds',
        orderCount: {
          buy: 3,
          sell: 3
        },
        total: 3000,
        WValue: 1000,
        orders: [
          {
            type: 'Buy',
            date: '03/08/2021 12:26:28',
            price: '0.20342',
            amount: 2000,
            filled: 10.8,
            WValue: 1040,
          },
          {
            type: 'Buy',
            date: '03/08/2021 12:26:28',
            price: '0.20342',
            amount: 2000,
            filled: 10.8,
            WValue: 1040,
          },
        ]
      }
    ]
  }),
  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'markets']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
        .sort((a, b) =>
          a.contract == this.network.baseToken.contract ? -1 : 1
        )
    }
  }
}
</script>

<style scoped lang="scss">
.table-header{
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .el-input{
    width: auto;
    min-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
}
.items{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  // TODO: might not be supperted in some browsers
  gap: 56px;
}
.item-container{
  // width: 33.3333%;
  // padding: 30px;
}
</style>
