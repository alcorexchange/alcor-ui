<template lang="pug">
.wallet
  .table-header
    el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search name or paste address')" size="small" clearable)
    el-checkbox() {{ $t('Hide small balances') }}
  virtual-table(:table="virtualTableData")
    template(#row="{ item }")
      wallet-row(:item="item" :useActions="true" @openDeposit="openDeposit", @openWithdraw="openWithdraw", @trade="trade", @pools="pools")

  DepositPopup(ref="depositPopup")
  WithdrawPopup(ref="withdrawPopup")
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import DepositPopup from '@/components/wallet/DepositPopup'
import WithdrawPopup from '@/components/wallet/WithdrawPopup'
import VirtualTable from '@/components/VirtualTable'
import WalletRow from '@/components/wallet/WalletRow'

export default {
  name: 'Wallet',
  components: {
    TokenImage,
    DepositPopup,
    WithdrawPopup,
    VirtualTable,
    WalletRow
  },
  data: () => ({
    search: ''
  }),
  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'markets']),
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
          width: '235px',
        },
        {
          label: 'Available',
          value: 'amount',
          width: '215px',
          sortable: true
        },
        {
          label: 'Actions',
          value: 'change24',
          width: '410px',
          desktopOnly: true
        }
      ]

      const data = this.balances
      const itemSize = 59
      const pageMode = true

      return { pageMode, itemSize, header, data }
    },

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
        .sort((a, b) => {
          if (a.contract == this.network.baseToken.contract) return -1

          if (a.usd_value > b.usd_value) return -1
          if (a.usd_value < b.usd_value) return 1

          return 0
        })
    }
  },

  methods: {
    pools(token) {
      this.$router.push({
        //query: { input: token.id.replace('@', '-') }
        name: `swap___${this.$i18n.locale}`
      })

      this.$store.commit('swap/setInput', {
        contract: token.contract,
        symbol: token.currency,
        precision: parseFloat(token.decimals)
      })
    },

    trade(token) {
      this.openInNewTab(`${this.$i18n.locale === 'en' ? '' : '/' + this.$i18n.locale}/markets?tab=all&search=` + `${token.currency}-${token.contract}`)
    },

    openDeposit() {
      this.$refs.depositPopup.openPopup({})
    },

    openWithdraw(row) {
      this.$refs.withdrawPopup.openPopup({
        token: {
          contract: row.contract,
          currency: row.currency,
          decimals: Number(row.decimals)
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
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

.el-card {
  border: none;
}
</style>
