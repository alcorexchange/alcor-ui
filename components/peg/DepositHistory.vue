<template lang="pug">
  .deposit-history
    h3.fs-16 Deposit History
    VirtualTable(:table="virtualTableData").virtual-deposit-table
      template(#empty)
      template(#row="{ item }")
        .deposit-history-item.fs-14
          .crypto
            span {{ item.currency.symbol }}
            span.muted.fs-12 {{ item.currency.chain.name }}
          .time(v-if="!isMobile") {{ item.created_at | moment('YYYY-MM-DD HH:mm') }}
          .status(v-if="!isMobile") {{ statuses[item.state]?.label || '??' }}
          .amount {{ item.amount }}
          .tx
            a(:href="$monitorBlockchainTx(item.tx_hash, item.currency.chain.code)" target="_blank").hover-opacity {{ middleEllipsis(item.tx_hash) }}
            span.hover-opacity.pointer(@click="copyTx(item.tx_hash)")
              i.el-icon-copy-document
</template>

<script>
import VirtualTable from '~/components/VirtualTable'

export default {
  name: 'DepositHistory',
  components: { VirtualTable },

  data: () => ({
    history: [],
    historyInterval: null,
    statuses: {
      created: { value: 'created', label: 'Created' },
      waiting_for_accumulation: { value: 'waiting_for_accumulation', label: 'Waiting for accumulation' },
      gas_required: { value: 'gas_required', label: 'Gas Required' },
      gas_price_too_high: { value: 'gas_price_too_high', label: 'Expensive GAS' },
      waiting_for_gas: { value: 'waiting_for_gas', label: 'Waiting for gas' },
      ready_for_accumulation: { value: 'ready_for_accumulation', label: 'Ready for accumulation' },
      accumulation_in_progress: { value: 'accumulation_in_progress', label: 'Accumulation in progress' },
      accumulated: { value: 'accumulated', label: 'Accumulated' },
      issue_in_progress: { value: 'issue_in_progress', label: 'Issue in progress' },
      issued_on_eosio: { value: 'issued_on_eosio', label: 'Issued' },
      failed: { value: 'failed', label: 'Issuance or transfer failed' },
      unknown_token: { value: 'unknown_token', label: 'Unknown token' },
    },
  }),

  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Crypto',
          width: '120px',
        },
        {
          label: 'Time',
          width: '180px',
          desktopOnly: true,
        },
        {
          label: 'Status',
          width: '140px',
          desktopOnly: true,
        },
        {
          label: 'Amount',
          width: '120px',
        },
        {
          label: 'Tx',
        },
      ]

      return { pageMode: true, itemSize: 59, header, data: this.history.map((item) => ({ ...item, id: item.tx_hash })) }
    },
  },

  mounted() {
    this.getHistory()
    this.runHistoryUpdate()
  },

  beforeDestroy() {
    this.stopHistoryUpdate()
  },

  methods: {
    async getHistory() {
      const user = 'aw.aq.waa'
      try {
        const { data } = await this.$axios.get(`https://gate.alcor.exchange/api/dex-accounts/${user}/deposits-history/`)

        this.history = data
      } catch (error) {
        console.log('Loading history error', error)
      }
    },

    runHistoryUpdate() {
      this.historyInterval = setInterval(() => this.getHistory(), 18 * 1000)
    },

    stopHistoryUpdate() {
      clearInterval(this.historyInterval)
    },

    middleEllipsis(str, startChars = 5, endChars = 3) {
      return str.length > startChars + endChars ? `${str.slice(0, startChars)}...${str.slice(-endChars)}` : str
    },

    copyTx(tx) {
      try {
        navigator.clipboard.writeText(tx)
        this.$notify({
          title: 'Clipboard',
          message: 'Address copied.',
          type: 'info',
        })
      } catch (error) {}
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
  align-items: center;
  .crypto {
    width: 120px;
    display: flex;
    flex-direction: column;
    @media only screen and (max-width: 1176px) {
      width: 33.3%;
    }
  }
  .time {
    width: 180px;
  }

  .status {
    width: 140px;
  }

  .amount {
    width: 120px;
    @media only screen and (max-width: 1176px) {
      width: 33.3%;
    }
  }
  .tx {
    display: flex;
    align-items: center;
    gap: 4px;
    a {
      color: var(--text-default);
    }
    @media only screen and (max-width: 1176px) {
      width: 33.3%;
    }
  }
}
</style>
