<template lang="pug">
.account-tokens-page
  .table-header
    el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search name or paste address')" size="small" clearable)

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
  data: () => ({
    balances: [],
    search: ''
  }),
  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Asset',
          value: 'currency',
          width: '300px',
          sortable: true
        },
        {
          label: 'Total',
          width: '380px'
        },
        {
          label: 'Available',
          value: 'amount',
          width: '400px',
          sortable: true
        }
      ]

      const data = this.filterdBalances
      const itemSize = 59
      const pageMode = true

      return { pageMode, itemSize, header, data }
    },
    filterdBalances() {
      return this.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false
          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
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
  width: 100%;
}

.table-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;

  .el-input {
    max-width: 300px;
    margin-right: 8px;
    margin-bottom: 8px;
  }

  .el-input__inner {
    background: transparent !important;
  }
}
</style>
