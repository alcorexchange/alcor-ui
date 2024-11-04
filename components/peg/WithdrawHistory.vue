<template lang="pug">
  .withdraw-history
    h3.fs-16 Recent Withdrawals
    VirtualTable(:table="virtualTableData").virtual-withdraw-table
      template(#empty)
        .empty.muted.p-4.fs-14
          i.el-icon-moon-night.fs-40
          span Your withdraw history will appear here.
      template(#row="{ item }")
        .deposit-history-item.pointer.fs-14(@click="showDetails(item)")
          .crypto
            span {{ item.currency.symbol }}
            span.muted.fs-12 {{ item.currency.chain.name }}
          .time {{ item.created_at | moment('YYYY-MM-DD HH:mm') }}
          .status(v-if="!isMobile") {{ statuses[item.state]?.label || '??' }}
          .amount
            .amount-value {{ item.amount }}
            .amount-fee.fs-12.muted Fee {{ item.our_fee_amount }}
          .address(v-if="!isMobile")
            span {{ middleEllipsis(item.address) }}
            span.hover-opacity.pointer(v-if="isMobile" @click.stop="copyTx(item.address)")
              i.el-icon-copy-document
          .action(v-if="!isMobile")
            AlcorButton()
              span.fs-12 Details
    WithdrawDetailModal(:active.sync="modalActive" :context="modalContext" :statuses="statuses")
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
import VirtualTable from '~/components/VirtualTable'
import WithdrawDetailModal from '~/components/peg/WithdrawDetailModal.vue'

export default {
  name: 'DepositHistory',
  components: { VirtualTable, AlcorButton, WithdrawDetailModal },

  data: () => ({
    history: [],
    historyInterval: null,
    statuses: {
      created: { value: 'created', label: 'Created' },
      pending: { value: 'pending', label: 'Pending' },
      burned: { value: 'burned', label: 'Burned' },
      pending_payout: { value: 'pending_payout', label: 'Pending payout' },
      completed: { value: 'completed', label: 'Completed' },
      failed: { value: 'failed', label: 'Failed' },
      cancelled: { value: 'cancelled', label: 'Cancelled' },
      verifying: { value: 'verifying', label: 'Verifying' },
      ready_to_payout: { value: 'ready_to_payout', label: 'Ready to payout' },
    },
    modalContext: null,
    modalActive: false,
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
          width: '140px',
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
          label: 'Address',
          width: '120px',
          desktopOnly: true,
        },
        {
          label: 'Action',
          desktopOnly: true,
        },
      ]

      return {
        pageMode: true,
        itemSize: 59,
        header,
        data: this.history.map((item) => ({ ...item, id: item.table_id })),
      }
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
        const { data } = await this.$axios.get(
          `https://gate.alcor.exchange/api/dex-accounts/${user}/withdrawals-history/`
        )

        console.log(data)

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

    showDetails(item) {
      this.modalContext = item
      this.modalActive = true
    },
  },
}
</script>

<style lang="scss">
.withdraw-history {
  .empty {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 16px;
  }
}
.virtual-withdraw-table {
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
    width: 140px;
    @media only screen and (max-width: 1176px) {
      width: 33.3%;
    }
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
  .address {
    display: flex;
    align-items: center;
    width: 120px;
    gap: 6px;
    a {
      color: var(--text-default);
      text-decoration: underline;
    }
  }
}
</style>
