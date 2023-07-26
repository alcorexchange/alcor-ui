<template lang="pug">
.bridge-history.mt-4
  //el-button(@click="test") test

  .toggle.d-flex.justify-content-center
    el-badge(:value="this.history.filter(i => i.proven == false).length" :hidden="this.history.filter(i => i.proven == false).length == 0" class="item")
      AlcorButton(@click="active = !active")
        span {{active ? 'Minimize' : 'Show'}} History
        i(:class="`el-icon-arrow-${active ? 'up' : 'down'}`")

  el-table(
    :data="history"
    v-if="active"
    v-loading="loading"
  ).bridge-history-table.custom-responsive-table.mt-4
    el-table-column(label="Time" width="120")
      template(slot-scope='{ row }')
        .time
          .hour {{ row.timestamp | moment('h:mm A z') }}
          .date {{ row.timestamp | moment('MMM. D, YYYY') }}
    el-table-column(label="Transfer" className="main")
      template(slot-scope='{ row }')
        .main-content
          .left
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${source.name}.png`)").network-img
                span {{ source.name.toUpperCase() }}
            .token-container
              img.token-img(:src="$tokenLogo(row.quantity.split(' ')[1], row.contract)")
              .amount {{ row.quantity.split(' ')[0] }}
              .symbol {{ row.quantity.split(' ')[1] }}
          .arrow
            i.el-icon-right
          .right
            .network
              span.text Network
              .network-content
                img(:src="require(`~/assets/icons/${row.chain}.png`)").network-img
                span {{ row.chain.toUpperCase() }}
            .token-container
              //img.token-img(:src="require(`~/assets/icons/${row.chain}.png`)")
              img.token-img(:src="$tokenLogo(row.quantity.split(' ')[1], row.contract)")
              .amount {{ row.quantity.split(' ')[0] }}
              .symbol {{ row.quantity.split(' ')[1] }}

    el-table-column(label="Tx link" width="70")
      template(#default="{row}")
       a(:href="monitorTx(row.tx.trx_id, source.name)" target="_blank").tx
          img(:src="require(`~/assets/icons/${'eos'}.png`)").tx-img
          span.tx-Link TX

    el-table-column(label="Status" width="140" className="status-col" align="right")
      template(slot-scope='{row}')
        .status.pointer(@click="complete(row)" :class="{completed: getStatus(row.proven).isCompleted}" v-loading="row.tx.trx_id == retrying")
          i(:class="getStatus(row.proven).icon")
          span {{ getStatus(row.proven).text }}
</template>

<script>
import { mapState, mapGetters, mapMutations } from 'vuex'

import { getReceiptDigest } from '~/core/ibc'
import AlcorButton from '~/components/AlcorButton.vue'
import { IBCTransfer } from '~/core/ibc.js'

export default {
  name: 'BridgeHistory',

  components: {
    AlcorButton,
  },

  props: ['sourceWallet', 'destinationWallet', 'connectToWallet'],

  data: () => ({
    active: true,
    retrying: null,
    loading: false,
    provenList: {},
    history: []
  }),

  computed: {
    ...mapState({
      network: state => state.network,
      ibcChains: state => state.ibcBridge.chains
    }),

    ...mapGetters({
      source: 'ibcBridge/source',
      destination: 'ibcBridge/destination',
      availableAssets: 'ibcBridge/availableAssets',
    })
  },

  watch: {
    source() {
      this.history = []
    },

    sourceWallet(to) {
      this.fetchHistoryFrom(this.source)
    },
  },

  methods: {
    ...mapMutations({
      setSourceName: 'ibcBridge/setSourceName',
      setDestinationName: 'ibcBridge/setDestinationName',
      // setTx: 'ibcBridge/setTx',
      // setPackedTx: 'ibcBridge/setPackedTx',
      // setError: 'ibcBridge/setError',
      // setProofs: 'ibcBridge/setProofs',
      setResult: 'ibcBridge/setResult',
      // setAsset: 'ibcBridge/setAsset',
    }),

    async complete(row) {
      if (row.proven || isNaN(this.retrying)) {
        return
      }

      const asset = this.availableAssets.find(a => a.nativeTokenContract == row.contract && a.symbol == row.quantity.split(' ')[1])

      // const asset = row.tx.native
      //   ? this.availableAssets.find(a => a.nativeTokenContract == row.contract && a.symbol == row.quantity.split(' ')[1])
      //   : this.availableAssets.find(a => a.sourceTokenContract == row.contract && a.symbol == row.quantity.split(' ')[1])

      // console.log({ row })
      // console.log('this.availableAssets', this.availableAssets)
      // console.log(asset)
      // return

      this.retrying = row.tx.trx_id

      this.setDestinationName(row.chain)
      if (!this.destinationWallet) {
        await this.connectToWallet()
      }

      const ibcTransfer = new IBCTransfer(
        this.source,
        this.destination,
        this.sourceWallet,
        this.destinationWallet,
        asset,
        (p) => console.log(p)
      )

      try {
        const last_proven_block = await ibcTransfer.getLastProvenBlock()

        const scheduleProofs =
          (await ibcTransfer.getScheduleProofs(row.tx)) || []

        // TODO Popup
        for (const proof of scheduleProofs) {
          await ibcTransfer.submitProofs([proof])
        }

        const block_num = row.tx.actions[0].block_num

        const xfer = row.tx.actions.find(action => action.act.name === 'emitxfer')
        console.log({ xfer })

        const emitxferAction = {
          act: xfer.act,
          receipt: {
            ...xfer.receipts[0],
            code_sequence: xfer.code_sequence,
            abi_sequence: xfer.abi_sequence,
          }
        }

        console.log({ emitxferAction })

        const auth_sequence = []

        for (const auth of xfer.receipts[0].auth_sequence) auth_sequence.push([auth.account, auth.sequence])
        emitxferAction.receipt.auth_sequence = auth_sequence

        const light =
          last_proven_block &&
          last_proven_block.block_height > block_num

        console.log({ light, block_num })

        const query = {
          type: light ? 'lightProof' : 'heavyProof',
          action: emitxferAction,
          block_to_prove: block_num //block that includes the emitxfer action we want to prove
        }

        // We have to push scheduleProofs one by one here
        console.log('scheduleProofs', scheduleProofs)

        //const emitxferAction = row.tx.actions.find(action => action.act.name === 'emitxfer')
        console.log('emitxferAction', emitxferAction)

        if (light) query.last_proven_block = last_proven_block.block_height

        const emitxferProof = await ibcTransfer.getProof(query)

        if (light)
          emitxferProof.data.blockproof.root =
            last_proven_block.block_merkle_root

        console.log('emitxferProof', emitxferProof)

        const { tx } = await ibcTransfer.submitProofs([emitxferProof])
        console.log('result:', tx)

        this.setResult({ source: row.tx.trx_id, destination: tx.transaction_id })

        const oldHistory = this.history
        oldHistory.forEach(h => {
          if (h.tx.trx_id == row.tx.trx_id) { h.proven = true }
        })

        this.history = oldHistory

        this.$notify({ type: 'success', title: 'Action proved', message: 'Transaction prooved' })
      } catch (e) {
        console.log(e)
        this.$notify({ type: 'error', title: 'Retry Error', message: e })
      } finally {
        this.retrying = null
      }
    },

    test() {
      console.log('test')
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
      this.loading = true

      const history = []

      try {
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
            `${chain.hyperion}/v2/history/get_actions?account=${this.sourceWallet.name}&filter=${contract}:retire&limit=100`
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

          const digest = await getReceiptDigest(this.source, _xfer.receipts[0], _xfer, true)

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

          const chain = tx.native ? wrapLockContractDetails.pairedChain : wrapLockContractDetails.chain
          const _contract = tx.native ? wrapLockContractDetails.pairedWrapTokenContract : wrapLockContractDetails.wrapLockContract

          await this.fetchProvenList(chain, _contract)

          const provenList = this.provenList[`${chain}_${_contract}`]
          const proven = provenList.map(i => i.receipt_digest).includes(digest)

          history.push({ chain, proven, timestamp, account, beneficiary, quantity, contract, wrapLockContractDetails, tx })
        }

        history.sort((a, b) => (a.timestamp < b.timestamp) ? 1 : ((a.timestamp > b.timestamp) ? -1 : 0))

        this.history = history
      } catch (e) {
        this.$notify({ type: 'error', title: 'History not loaded', message: e.message })
      } finally {
        this.loading = false
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
