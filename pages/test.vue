<template lang="pug">
div
  h1 test page
  span result: {{ result }}
</template>

<script>
import { JsonRpc, Api } from 'eosjs'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'

ScatterJS.plugins(new ScatterEOS())



const network = ScatterJS.Network.fromJson({
  blockchain: 'eos',
  chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
  host: 'nodes.get-scatter.com',
  port: 443,
  protocol: 'https'
})

let scatter = null

const rpc = new JsonRpc(network.fullhost())

//const getScatterEos = () => scatter.eos(network, Api, { rpc })

export default {
  data() {
    return {
      result: {}
    }
  },

  async mounted() {
    //if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    //  console.log('listen scatter hook')
    //  // @ts-ignore:
    //  scatter = window.scatter
    //  document.addEventListener('scatterLoaded', () => {
    //    console.log('scatter connect in hook')
    //    // @ts-ignore:
    //    scatter = window.scatter
    //  })
    //}

    await ScatterJS.scatter.connect('eosjs2-test', { network }).then(connected => {
      console.log('connect', connected)
      if (!connected) return false
      scatter = ScatterJS.scatter
      console.log('scatter', ScatterJS)
    })

    await scatter.login()

    let tx = {
      actions: [{
        account: 'eosio.token',
        name: 'transfer',
        authorization: [{
          actor: 'mapalamapala',
          permission: 'active'
        }],
        data: {
          from: 'mapalamapala',
          to: 'safetransfer',
          quantity: '0.0001 EOS',
          memo: 'mapalamapala'
        }
      }]
    }

    const eos = scatter.eos(network, Api, { rpc })

    const api = eos
    //const api = new Api({ rpc, chainId: network.chainId, signatureProvider: eos.signatureProvider })
    console.log(eos)
    //const api = eos

    //const blocksBehind = 3
    //const expireSeconds = 30

    //if ((typeof blocksBehind === 'number' || false) && expireSeconds) {
    //  tx = await api.generateTapos(undefined, tx, blocksBehind, undefined, expireSeconds)
    //}


    //const abis = await api.getTransactionAbis(tx)
    //tx = {
    //  ...tx,
    //  context_free_actions: await api.serializeActions(tx.context_free_actions || []),
    //  actions: await api.serializeActions(tx.actions)
    //}

    //const serializedTransaction = api.serializeTransaction(tx)
    //const serializedContextFreeData = api.serializeContextFreeData(tx.context_free_data)
    //let pushTransactionArgs = {
    //  serializedTransaction, serializedContextFreeData, signatures: []
    //}

    //const availableKeys = await api.signatureProvider.getAvailableKeys()
    //console.log('1, tx', tx, availableKeys)
    //const requiredKeys = await api.authorityProvider.getRequiredKeys({ tx, availableKeys })
    //console.log('2, tx', tx)
    //pushTransactionArgs = await api.signatureProvider.sign({
    //  chainId: api.chainId,
    //  requiredKeys,
    //  serializedTransaction,
    //  serializedContextFreeData,
    //  abis
    //})

    //console.log('pushTransactionArgs', pushTransactionArgs)

    const result = await api.transact(tx, {
      blocksBehind: 3,
      expireSeconds: 30,
    })

    this.result = result
  }
}
</script>
