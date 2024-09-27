require('dotenv').config()

import { fetchAllRows } from '../../../utils/eosjs'
import { chains, getWrapLockContracts } from './ibcChains'
import { getReceiptDigest } from './digest'
import { prove } from './prove'
import { eosCexDepsitsWorker } from './eosCexDepositProver'

const EOS_CEX_ACCOUNTS = [
  'kucoindoteos', 'binancecleos', 'huobideposit', 'okbtothemoon', 'eosdididada3', 'bitfinexcw55', 'bitfinexdep1', 'eosbndeposit', 'mxcexdeposit'
]

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
        limit: 100,
        skip: xfers.length,
        sort: -1,
        ...params
      }
    })

    xfers.push(...actions)

    // GET ONLY LAST 100
    break

    if (xfers.length == total.value) {
      break
    }
  }

  // from oldest to nevest
  xfers.sort((a, b) => a.block_num - b.block_num)

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
  if (sourceChain.name == 'wax' && contract == 'usdt.alcor') getActionsParams.after = '2023-12-18T14:25:14.500'

  let actions = await getActions(sourceChain, contract, getActionsParams)

  // Prove only trnasfers to CEX's
  if (sourceChain.name == 'wax' && contract == 'usdt.alcor') {
    actions = actions.filter(a => {
      const memo = a.act.data.xfer.memo || ''
      const cex_account = memo.split('#')[0]

      return EOS_CEX_ACCOUNTS.includes(cex_account)
    })
  }

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

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function proveTransfers(ibcToken, sourceChain, destinationChain, _native) {
  while (true) {
    console.log('prove transfers while.. ', sourceChain.name, destinationChain.name)
    try {
      const actions = await fetchXfers(chains, ibcToken, _native)

      for (const action of actions) {
        if (!action.proven) {
          console.log(action.timestamp, action)
          const proved = await prove(sourceChain, destinationChain, action, ibcToken, _native)
          console.log({ proved })
        }
      }
    } catch (e) {
      console.error('IBC WORKER ERROR', e)
    }

    await sleep(10 * 1000)
  }
}

async function eosToWaxWorker(ibcTokens) {
  console.log('EOS USDT.ALCOR -> WAX WORKER STARTED')
  const USDT_ALCOR = ibcTokens.find(i => i.wrapLockContract == 'w.ibc.alcor' && i.chain == 'eos')

  const _native = true
  const sourceChain = _native ? chains.find(c => c.name == USDT_ALCOR.chain) : chains.find(c => c.name == USDT_ALCOR.pairedChain)
  const destinationChain = _native ? chains.find(c => c.name == USDT_ALCOR.pairedChain) : chains.find(c => c.name == USDT_ALCOR.chain)

  await proveTransfers(USDT_ALCOR, sourceChain, destinationChain, _native)
}

async function WaxToEosWorker(ibcTokens) {
  console.log('WAX USDT.ALCOR -> EOS WORKER STARTED')

  const USDT_ALCOR = ibcTokens.find(i => i.wrapLockContract == 'w.ibc.alcor' && i.chain == 'eos')

  const _native = false
  const sourceChain = _native ? chains.find(c => c.name == USDT_ALCOR.chain) : chains.find(c => c.name == USDT_ALCOR.pairedChain)
  const destinationChain = _native ? chains.find(c => c.name == USDT_ALCOR.pairedChain) : chains.find(c => c.name == USDT_ALCOR.chain)

  await proveTransfers(USDT_ALCOR, sourceChain, destinationChain, _native)
}

async function main() {
  const ibcTokens = await getWrapLockContracts(chains)

  await Promise.all([
    WaxToEosWorker(ibcTokens),
    //eosToWaxWorker(ibcTokens),
    eosCexDepsitsWorker()
  ])
}

main()
