<template lang="pug">
  div.pools
    .table-header
      el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
    .table.el-card.is-always-shadow
      el-table.market-table(
        :data='mock',
        style='width: 100%',
      )
        el-table-column(label='Pools')
          template(slot-scope='{row}')
            .asset-container
              PairIcons(:token1="{symbol: '', contract: ''}" :token2="{symbol: '', contract: ''}")

              div.asset
                span.asset-name {{ row.pair }}
                span.asset-contract.cancel {{row.contract}}

        el-table-column(label='Deposit',)
          template(slot-scope='{row}')
            .detailed-item-container
              span.main.fwr {{row.deposit.usd}} $
              span.cancel.fontSmall {{row.deposit.pair1}}
              span.cancel.fontSmall {{row.deposit.pair2}}
        el-table-column(
          label='Earnings',
        )
          template(slot-scope='{row}')
            .detailed-item-container
              span.main.fwr {{row.deposit.usd}} $
              span.cancel.fontSmall {{row.deposit.pair1}}
              span.cancel.fontSmall {{row.deposit.pair2}}
        el-table-column(
          label='Earnings WAX Value',
        )
          //- TODO: dynamic
          template(slot-scope='{row}') {{ row.earningWaxValue }}
        el-table-column(
          label='Actions',
        )
          template(slot-scope='{row}')
            .actions
              AlcorButton(iconOnly).add
                i.el-icon-plus
              AlcorButton(iconOnly).remove
                i.el-icon-minus
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import TokenImage from '@/components/elements/TokenImage'
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'WalletLiquidityPools',
  components: {
    TokenImage,
    AlcorButton
  },
  data: () => ({
    search: '',
    mock: [
      {
        pair: 'EOS/USDT',
        contract: 'alcor.dex',
        deposit: {
          usd: '100,000.00',
          pair1: '100 EOS',
          pair2: '2,000 USDT'
        },
        earning: {
          usd: '2,000.00',
          pair1: '100 EOS',
          pair2: '2,000 USDT',
        },
        earningWaxValue: '30,000 WAX',
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
    max-width: 300px;
    margin-right: 8px;
  }
  .el-input__inner{
    background: transparent !important;
  }
}
.el-card{
  border: none;
}
.asset-container{
  display: flex;
  align-items: center;
  .asset{
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }
  .asset-name{
    font-weight: bold;
  }
}
.detailed-item-container{
  display: flex;
  flex-direction: column;
}
.actions{
  display: flex;
  .add {
    background:var(--main-green);
    margin-right: 8px;
    &:hover {
      opacity: 0.8;
    }
  }
  .remove {
    background:var(--main-red);
    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
