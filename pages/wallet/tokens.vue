<template lang="pug">
.wallet
  .table-header
    el-input(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search name or paste address')" size="small" clearable)
    el-checkbox() {{ $t('Hide small balances') }}
  virtual-table(:table="virtualTableData")
    template(#row="{ item }")
      WalletRow(:item="item" :useActions="true" @openDeposit="openDeposit", @openWithdraw="openWithdraw" @openTransfer="openTransfer" @trade="trade", @pools="pools")

  DepositPopup(ref="depositPopup")
  WaxUSDTDepositPopup(ref="waxUSDTdepositPopup")
  WaxUSDTWithdrewPopup(ref="waxUSDTWithdrewPopup")
  TransferPopup(ref="transferPopup")
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import DepositPopup from '@/components/wallet/DepositPopup'
import WaxUSDTDepositPopup from '@/components/wallet/WaxUSDTDepositPopup'
import WaxUSDTWithdrewPopup from '@/components/wallet/WaxUSDTWithdrewPopup'
import TransferPopup from '@/components/wallet/TransferPopup'
import VirtualTable from '@/components/VirtualTable'
import WalletRow from '@/components/wallet/WalletRow'

export default {
  name: 'Wallet',
  components: {
    TokenImage,
    DepositPopup,
    TransferPopup,
    VirtualTable,
    WalletRow,
    WaxUSDTDepositPopup,
    WaxUSDTWithdrewPopup
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
          value: 'amount',
          sortable: true
        },
        {
          label: 'Available',
          width: '215px'
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

      const balances = this.$store.getters['wallet/balances']
        .filter((b) => {
          //if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })

      return balances
    }
  },

  methods: {
    pools(token) {
      this.$router.push(
        this.localeRoute({
          path: '/swap',
          query: {
            input: `${token.currency}-${token.contract}`,
          },
        })
      )
    },

    trade(token) {
      this.openInNewTab(
        `${
          this.$i18n.locale === 'en' ? '' : '/' + this.$i18n.locale
        }/markets?tab=all&search=` + `${token.currency}-${token.contract}`
      )
    },

    openDeposit(item) {
      if (this.network.name == 'wax' && item.contract == 'usdt.alcor') {
        this.$refs.waxUSDTdepositPopup.openPopup({})
      } else {
        this.$refs.depositPopup.openPopup({})
      }
    },

    openWithdraw(row) {
      if (this.network.name == 'wax' && row.contract == 'usdt.alcor') {
        this.$refs.waxUSDTWithdrewPopup.openPopup({})
      }
    },

    openTransfer(row) {
      console.log('open transfer')
      this.$refs.transferPopup.openPopup({
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
