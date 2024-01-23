require('dotenv').config()

import { Api } from 'eosjs'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'

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
  const signedDestinationTx = await api.transact({
    actions
  }, { broadcast: true, expireSeconds: 360, blocksBehind: 3 })

  return await this.submitTx(signedDestinationTx, this.destination, 6)
}

async function transferDeposits() {
  const deposits = await fetchAllRows(eos_chain.rpc, {
    code: CONTRACT_ACCOUNT,
    scope: CONTRACT_ACCOUNT,
    table: 'deposits',
  })

  if (isObjectEmpty(deposits) || deposits.rows.length == 0) {
    console.info('No deposits found at ', new Date().toJSON())
    return
  }

  for (const deposit of deposits.rows) {
    const actions = [{
      account: deposit.deposit_token.contract,
      name: 'transfer',
      authorization: [{
        CONTRACT_ACCOUNT,
        permission: 'active'
      }],
      data: [CONTRACT_ACCOUNT, deposit.cex_account, deposit.deposit_token.quantity, deposit.deposit_memo]
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
      await sleep(5000)
    } catch (e) {
      console.error('EOS DEPOSITS WORKER ERR:', e)
    }
  }
}

eosCexDepsitsWorker()
