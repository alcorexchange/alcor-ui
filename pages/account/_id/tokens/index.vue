<template lang="pug">
.account-tokens-page
  virtual-table(:table="virtualTableData")
    template(#row="{ item }")
      wallet-row(:item="item")

</template>

<script>
import { mapActions } from 'vuex'
import VirtualTable from '@/components/VirtualTable'
import WalletRow from '@/components/wallet/WalletRow'

export default {
  components: { VirtualTable, WalletRow },
  data: () => ({ balances: [] }),
  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Asset',
          value: 'currency',
          width: '220px',
          sortable: true
        },
        {
          label: 'Total',
          width: '355px'
        },
        {
          label: 'Available',
          value: 'amount',
          width: '340px',
          sortable: true
        }
      ]

      const data = this.balances
      const itemSize = 59
      const pageMode = true

      return { pageMode, itemSize, header, data }
    }
  },
  mounted() {
    this.getAccountBalances()
  },
  methods: {
    ...mapActions(['loadAccountBalance']),
    async getAccountBalances() {
      this.balances = await this.loadAccountBalance(this.$route.params.id)
    }
  }
}
</script>

<style lang="scss" scoped>
.account-tokens-page {
  width: 955px;
}
</style>
