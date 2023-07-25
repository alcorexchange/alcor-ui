<template lang="pug">
.bridge-history.mt-4
  el-button(@click="test") test

  .toggle.d-flex.justify-content-center
    AlcorButton(@click="active = !active")
      span {{active ? 'Minimize' : 'Show'}} History
      i(:class="`el-icon-arrow-${active ? 'up' : 'down'}`")

  el-table(
    :data="[{}, {}]"
    v-if="active"
  ).bridge-history-table.custom-responsive-table.mt-4
    el-table-column(label="Time" width="100")
      template(slot-scope='{row}')
        .time
          .hour 13:48
          .date Jul 9, 2023
    el-table-column(label="Transfer" className="main")
      template(slot-scope='{row}')
        .main-content
          .left
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
                span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM
          .arrow
            i.el-icon-right
          .right
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${'wax'}.png`)").network-img
                span EOS
            .token-container
              img.token-img(:src="require(`~/assets/icons/${'matic'}.png`)")
              .amount 10.00
              .symbol TLM

    el-table-column(label="Txs" width="100")
      template(#default="{row}")
       .tx
          img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
          span.tx-Link TX link

    el-table-column(label="Status" width="140" className="status-col" align="right")
      template(slot-scope='{row}')
        .status(:class="{completed: getStatus(true).isCompleted}")
          i(:class="getStatus(true).icon")
          span {{ getStatus(true).text }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import { getReceiptDigest } from '~/core/ibc'
import AlcorButton from '~/components/AlcorButton.vue'

export default {
  name: 'BridgeHistory',

  components: {
    AlcorButton,
  },

  props: ['sourceWallet', 'destinationWallet'],

  data: () => ({
    active: true,
    provenList: {}
  }),

  computed: {
    ...mapState({
      ibcChains: state => state.ibcBridge.chains
    }),

    ...mapGetters({
      source: 'ibcBridge/source',
      destination: 'ibcBridge/destination',
      availableAssets: 'ibcBridge/availableAssets',
    })
  },

  watch: {
    sourceWallet() {
      //this.fetchHistoryFrom(this.source)
    },

    destinationWallet() {
      console.log('destinationWallet change', this.destinationWallet)
    }
  },

  methods: {
    test() {
      console.log('test')
      console.log('ibcChains', this.ibcChains)
      this.fetchHistoryFrom(this.source)
    },

    async fetchProvenList(chain, contract) {
      if (`${chain}_${contract}` in this.provenList) return

      const rpc = Object.values(this.ibcChains).find(c => c.name == chain).rpc

      const { rows } = await rpc.get_table_rows({
        code: contract,
        scope: contract,
        table: 'processed',
        limit: 1000,
        reverse: true
      })

      this.provenList[`${chain}_${contract}`] = rows
    },

    async fetchHistoryFrom(chain) {
      console.log('source:', this.source)
      console.log('sourceWallet change', this.sourceWallet)

      const wrapLockContracts = []
      for (const proofContract in chain.ibc.wrapLockContracts) {
        wrapLockContracts.push(...chain.ibc.wrapLockContracts[proofContract])
      }

      const wrapTokenContracts = []
      for (const proofContract in chain.ibc.wrapTokenContracts) {
        wrapTokenContracts.push(...chain.ibc.wrapTokenContracts[proofContract])
      }

      console.log({ wrapLockContracts, wrapTokenContracts })

      const wrappedContractsTxs = []
      for (const contract of wrapTokenContracts) {
        const { data: { actions } } = await this.$axios.get(
          `${chain.hyperion}/v2/history/get_actions?account=${this.sourceWallet.name}&filter=${contract}:retire&limit=15`
        )

        wrappedContractsTxs.push(...actions)
      }

      const lockContractsTxs = []
      for (const contract of wrapLockContracts) {
        const { data: { actions } } = await this.$axios.get(
          chain.hyperion +
          `/v2/history/get_actions?account=${contract}&filter=*:transfer&transfer.from=${this.sourceWallet.name}&limit=100`
        )

        lockContractsTxs.push(...actions)
      }

      //const txPromises = [...lockContractsTxs, ...wrappedContractsTxs].map(tx => {
      const lockContractPromises = lockContractsTxs.map(tx => {
        return this.$axios.get(chain.hyperion + `/v2/history/get_transaction?id=${tx.trx_id}`)
      })

      const wrappedTokenPromises = wrappedContractsTxs.map(tx => {
        return this.$axios.get(chain.hyperion + `/v2/history/get_transaction?id=${tx.trx_id}`)
      })

      const locktxResults = await Promise.all(lockContractPromises)
      locktxResults.forEach(i => i.data.native = true)

      const wrappedResults = await Promise.all(wrappedTokenPromises)
      wrappedResults.forEach(i => i.data.native = false)

      //console.log({ locktxResults, wrappedResults })

      for (const { data: tx } of [...locktxResults, ...wrappedResults]) {
        const _xfer = tx.actions.find(action => action.act.name === 'emitxfer')

        if (!_xfer) {
          console.log('NO XFER!!', tx)
          continue
        }

        //console.log('try get digist', _xfer)
        const digest = await getReceiptDigest(this.source.rpc, _xfer.receipts[0], _xfer, true)

        const { timestamp, act: { account, data: { xfer: { beneficiary, quantity: { quantity, contract } } } } } = _xfer

        // Find dest chain details by lock contract
        let wrapLockContractDetails

        for (const chain of Object.values(this.ibcChains)) {
          for (const details of chain.wrapLockContracts) {
            if (tx.native && details.wrapLockContract == account && details.symbols.includes(quantity.split(' ')[1])) {
              wrapLockContractDetails = details
            }

            if (!tx.native && details.pairedWrapTokenContract == account && details.symbols.includes(quantity.split(' ')[1])) {
              wrapLockContractDetails = details
            }
          }
        }

        await this.fetchProvenList(wrapLockContractDetails.pairedChain,
          tx.native ? wrapLockContractDetails.pairedWrapTokenContract : wrapLockContractDetails.wrapLockContract)

        const provenList = this.provenList[`${wrapLockContractDetails.pairedChain}_${wrapLockContractDetails.pairedWrapTokenContract}`]
        const proven = provenList.map(i => i.receipt_digest).includes(digest)

        console.log({ proven, timestamp, account, beneficiary, quantity, contract, wrapLockContractDetails })
      }
    },

    getStatus(completed) {
      return completed
        ? {
          icon: 'el-icon-check',
          text: 'Completed',
          isCompleted: true,
        }
        : {
          icon: 'el-icon-error',
          text: 'Not Completed',
          isCompleted: false,
        }
    },
  }
}
</script>

<style scoped lang="scss">
.main-content {
  display: flex;
  align-items: flex-start;
  align-self: center;
  gap: 8px;
  .left,
  .right {
    display: flex;
    gap: 4px;
    flex-direction: column;
  }
  .arrow i {
    font-size: 1.4rem;
  }
  .left {
    align-items: flex-end;
  }
  .right {
    align-items: flex-start;
  }
  .network {
    display: flex;
    gap: 4px;
    align-items: center;
    &-content {
      font-size: 0.86rem;
      background: var(--btn-active);
      padding: 2px 6px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .text {
      font-size: 0.86rem;
    }
    &-img {
      height: 18px;
    }
  }
  .token-container {
    display: flex;
    gap: 4px;
    align-items: center;
    font-size: 1rem;
  }
  .token-img {
    height: 18px;
  }
}
.tx {
  display: flex;
  align-items: center;
  font-size: 0.86rem;
  .tx-img {
    height: 18px;
  }
}
.status {
  box-shadow: 0 0 0 1px var(--main-red);
  padding: 2px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.86rem;
  border-radius: 4px;
  color: var(--main-red);
  i {
    line-height: 0;
  }

  &.completed {
    box-shadow: none;
    color: var(--main-green);
  }
}
.time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .hour {
    font-size: 0.86rem;
  }
}
</style>

<style lang="scss">
.bridge-history-table {
  border-radius: 8px;
  .status-col {
    .cell {
      padding: 2px 10px !important;
      display: flex;
      justify-content: flex-end;
    }
  }
}
@media only screen and (max-width: 1100px) {
  .bridge-history-table {
    .main {
      grid-column: 1 / 3;
      margin: auto;
    }
    .cell {
      padding: 0 !important;
    }
    .status-col {
      margin-left: auto;
      .cell {
        padding: 2px !important;
      }
    }
    .time {
      flex-direction: row;
    }
  }
}
</style>
