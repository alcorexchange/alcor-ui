require('dotenv').config()

import axios from 'axios'
import { networks } from '../../../config'
import { fetchAllRows, getMultyEndRpc } from '../../../utils/eosjs'
import { getWrapLockContracts } from './ibcChains'
import { getReceiptDigest } from './digest'
import { prove } from './prove'


async function fetchProvenList(chain, contract) {
  console.log('fetchProvenList', chain.name, contract)
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

async function getActions(chain, account) {
  const xfers = []

  while (true) {
    const { data: { total, actions } } = await chain.hyperion.get('v2/history/get_actions', {
      params: {
        account,
        'act.name': 'emitxfer',
        limit: 1000,
        skip: xfers.length,
        sort: -1
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

  const actions = await getActions(sourceChain, contract)

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

//async function completeTrnasfer(sour) {
//  const destinationChain = chains.find(c => c.name == lockContract.pairedChain)
//  const proved = await prove(chain, destinationChain, action, lockContract, true)
//  console.log(proved)
//}

async function main() {
  const ibcTokens = await getWrapLockContracts(chains)

  const USDT_ALCOR = ibcTokens.find(i => i.wrapLockContract == 'usdtlocktest' && i.chain == 'eos')

  const _native = true

  const sourceChain = _native ? chains.find(c => c.name == USDT_ALCOR.chain) : chains.find(c => c.name == USDT_ALCOR.pairedChain)
  const destinationChain = _native ? chains.find(c => c.name == USDT_ALCOR.pairedChain) : chains.find(c => c.name == USDT_ALCOR.chain)

  const actions = await fetchXfers(chains, USDT_ALCOR, _native)

  for (const action of actions) {
    if (!action.proven) {
      const proved = await prove(sourceChain, destinationChain, action, USDT_ALCOR, _native)
      console.log(proved)
    }
  }
}

main()
