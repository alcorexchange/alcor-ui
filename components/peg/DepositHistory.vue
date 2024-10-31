<template lang="pug">
  .deposit-history
    h3.fs-16 Deposit History
    VirtualTable(:table="virtualTableData").virtual-deposit-table
      template(#empty)
      template(#row="{ item }")
        .deposit-history-item
          .crypto {{ item.currency.symbol }}
</template>

<script>
import VirtualTable from '~/components/VirtualTable'
export default {
  name: 'DepositHistory',
  components: { VirtualTable },

  data: () => ({
    history: [],
  }),

  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Crypto',
          width: '80px',
        },
        {
          label: 'Network',
          width: '80px',
        },
        {
          label: 'Time',
          width: '80px',
        },
        {
          label: 'Status',
          width: '80px',
        },
        {
          label: 'Amount',
          width: '80px',
        },
        {
          label: 'Tx',
          width: '80px',
        },
      ]

      return { pageMode: true, itemSize: 42, header, data: this.history.map((item) => ({ ...item, id: item.tx_hash })) }
    },
  },

  mounted() {
    this.getHistory()
  },

  methods: {
    async getHistory() {
      const user = 'aw.aq.waa'
      try {
        const { data } = await this.$axios.get(`https://gate.alcor.exchange/api/dex-accounts/${user}/deposits-history/`)
        console.log(data)

        this.history = data
      } catch (error) {
        console.log('Loading history error', error)
      }
    },
  },
}
</script>

<style lang="scss">
.virtual-deposit-table {
  .header {
    padding: 15px 10px;
    text-align: left !important;
  }
  .header__column {
    font-weight: 400;
    font-size: 14px;
    justify-content: flex-start;
    color: var(--text-disable);
  }
}
.deposit-history-item {
  display: flex;
  padding: 10px;
}
</style>
