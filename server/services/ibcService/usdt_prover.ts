require('dotenv').config()

import axios from 'axios'
import { networks } from '../../../config'
import { fetchAllRows, getMultyEndRpc } from '../../../utils/eosjs'
import { getWrapLockContracts } from './ibcChains'
import { getReceiptDigest } from './digest'
import { prove } from './prove'


async function fetchProvenList(chain, contract) {
  // Add chache
  const rows = await fetchAllRows(chain.rpc, {
    code: contract,
    scope: contract,
    table: 'processed'
  })

  return rows.map(i => i.receipt_digest)
}

const sequences = {}
async function getSequince(chain, contract, id) {
  const cache_id = chain.name + contract

  if (sequences[cache_id]) return sequences[cache_id]

  console.log('query sequences')
  const { data: { actions } } = await chain.hyperion.get('v2/history/get_transaction', {
    params: { id }
  })

  const { code_sequence, abi_sequence } = actions.find(a => a.act.name === 'emitxfer')

  sequences[cache_id] = { code_sequence, abi_sequence }
  return { code_sequence, abi_sequence }
}

async function getActions(chain, account, params = {}) {
  const xfers = []

  while (true) {
    const { data: { total, actions } } = await chain.hyperion.get('v2/history/get_actions', {
      params: {
        account,
        'act.name': 'emitxfer',
        limit: 1000,
        skip: xfers.length,
        sort: -1,
        ...params
      }
    })

    xfers.push(...actions)

    if (xfers.length == total.value) {
      break
    }
  }

  return xfers
}

async function fetchXfers(chains, lockContract, _native) {
  const contract = _native ? lockContract.wrapLockContract : lockContract.pairedWrapTokenContract
  const paired_contract = _native ? lockContract.pairedWrapTokenContract : lockContract.wrapLockContract

  const sourceChain = _native ? chains.find(c => c.name == lockContract.chain) : chains.find(c => c.name == lockContract.pairedChain)
  const destinationChain = _native ? chains.find(c => c.name == lockContract.pairedChain) : chains.find(c => c.name == lockContract.chain)

  const getActionsParams: any = {}

  // Protocol updated
  if (sourceChain.name == 'eos' && contract == 'w.ibc.alcor') getActionsParams.after = '2023-12-18T14:25:14.500'

  const actions = await getActions(sourceChain, contract, getActionsParams)

  if (actions.length == 0) return []

  const sequences = await getSequince(sourceChain, contract, actions[0].trx_id)
  const provenList = await fetchProvenList(destinationChain, paired_contract)

  for (const action of actions) {
    Object.assign(action, sequences)

    action.digest = await getReceiptDigest(sourceChain, action.receipts[0], action, true)
    action.proven = provenList.includes(action.digest)
  }

  return actions
}

const supportedNetworks = ['eos', 'wax', 'telos', 'ux']
//const supportedNetworks = ['eos']

const chains = []

for (const network of Object.values(networks).filter((n: any) => supportedNetworks.includes(n.name)) as any) {
  const nodes = Object.keys(network.client_nodes)
  nodes.sort((a, b) => (a.includes('alcor') ? -1 : 1))

  chains.push({
    ...network,
    hyperion: axios.create({ baseURL: network.hyperion }),
    rpc: getMultyEndRpc(nodes),
    wrapLockContracts: []
  })
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function main() {
  console.log('EOS USDT.ALCOR -> WAX WORKER STARTED')
  const ibcTokens = await getWrapLockContracts(chains)

  const USDT_ALCOR = ibcTokens.find(i => i.wrapLockContract == 'w.ibc.alcor' && i.chain == 'eos')

  const _native = true

  const sourceChain = _native ? chains.find(c => c.name == USDT_ALCOR.chain) : chains.find(c => c.name == USDT_ALCOR.pairedChain)
  const destinationChain = _native ? chains.find(c => c.name == USDT_ALCOR.pairedChain) : chains.find(c => c.name == USDT_ALCOR.chain)

  while (true) {
    // Proving USDT every minute
    try {
      const actions = await fetchXfers(chains, USDT_ALCOR, _native)

      for (const action of actions) {
        if (!action.proven) {
          console.log(action.timestamp, action.act.data)
          const proved = await prove(sourceChain, destinationChain, action, USDT_ALCOR, _native)
          console.log({ proved })
        }
      }
    } catch (e) {
      console.error('IBC WORKER ERROR', e)
    }

    await sleep(60 * 1000)
  }
}

main()
