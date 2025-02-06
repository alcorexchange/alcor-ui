require('dotenv').config()

import { Api } from 'enf-eosjs'
import { JsSignatureProvider } from 'enf-eosjs/dist/eosjs-jssig'

import { fetchAllRows } from '../../../utils/eosjs'
import { chains } from './ibcChains'

const CONTRACT_ACCOUNT = 'cexdep.alcor'

if (!process.env.EOS_CEXDEPOSIT_WOKERK_KEY) throw new Error('EOS_CEXDEPOSIT_WOKERK_KEY is required')

const isObjectEmpty = (objectName) => {
  return Object.keys(objectName).length === 0
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const eos_chain = chains.find(c => c.name == 'eos')

const signatureProvider = new JsSignatureProvider([
  process.env.EOS_CEXDEPOSIT_WOKERK_KEY
])

const api = new Api({ rpc: eos_chain.rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })

async function sendTransaction(actions) {
  const result = await api.transact({
    actions
  }, { broadcast: true, expireSeconds: 360, blocksBehind: 3 })

  return result
}

async function transferDeposits() {
  const deposits = await fetchAllRows(eos_chain.rpc, {
    code: CONTRACT_ACCOUNT,
    scope: CONTRACT_ACCOUNT,
    table: 'deposits',
  })

  if (deposits.length == 0) {
    //console.info('No deposits found at ', new Date().toJSON())
    return
  }

  for (const deposit of deposits) {
    const actions = [{
      account: deposit.deposit_token.contract,
      name: 'transfer',
      authorization: [{
        actor: CONTRACT_ACCOUNT,
        permission: 'active'
      }],

      data: {
        from: CONTRACT_ACCOUNT,
        to: deposit.cex_account,
        quantity: deposit.deposit_token.quantity,
        memo: deposit.deposit_memo
      }
    }]

    const r = await sendTransaction(actions)

    console.info('Transfer a deposit with transaction_id: ' + r.transaction_id + ' at ', new Date().toJSON())
  }
}

export async function eosCexDepsitsWorker() {
  console.log('eosCexDepsitsWorker start')

  while (true) {
    try {
      await transferDeposits()
      await sleep(15000)
    } catch (e) {
      console.error('EOS DEPOSITS WORKER ERR:', e)
    }
  }
}
