<template lang="pug">
.account-tokens-page
  virtual-table(:table="virtualTableData")
    template(#row="{ item }")
      pre {{ item }}
      //wallet-row(:item="item" @openDeposit="openDeposit", @openWithdraw="openWithdraw", @trade="trade", @pools="pools")

</template>

<script>
export default {
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
          width: '235px'
        },
        {
          label: 'Available',
          value: 'amount',
          width: '215px',
          sortable: true
        }
      ]

      //const data = this.balances
      const itemSize = 59
      const pageMode = true

      return { pageMode, itemSize, header, data }
    }
  }
}
</script>
