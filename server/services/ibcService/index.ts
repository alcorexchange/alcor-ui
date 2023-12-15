import { getChainsWithLockContracts } from './ibcChains'
import { getReceiptDigest } from './digest'
import { fetchAllRows } from '../../../utils/eosjs'

// function getDestinationDetails(sourceName, isNative, contract, quantity) {
//   // Find dest chain details by lock contract
//   let wrapLockContractDetails = {}

//   for (const chain of Object.values(chains) as any) {
//     for (const details of chain.wrapLockContracts) {
//       if (isNative &&
//         details.wrapLockContract == contract &&
//         details.symbols.includes(quantity.split(' ')[1]) &&
//         details.chain == sourceName
//       ) {
//         wrapLockContractDetails = details
//       }

//       if (!isNative &&
//         details.pairedWrapTokenContract == contract &&
//         details.symbols.includes(quantity.split(' ')[1]) &&
//         details.pairedChain == sourceName
//       ) {
//         wrapLockContractDetails = details
//       }
//     }
//   }

//   return wrapLockContractDetails
// }

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

// const { data: { actions } } = await chain.hyperion.get(
//   'https://eos.eosusa.io/v2/history/get_transaction?id=37458eaae20217eb0901c74b91a51189ad79ce3743d8a0186bf6c81795f1af1c'
// )
// const _xfer = actions.find(action => action.act.name === 'emitxfer')
// const digest = await getReceiptDigest(chain, _xfer.receipts[0], _xfer, true)

// console.log({ digest })

async function getXfers(chain, account) {
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

async function main() {
  const chains = await getChainsWithLockContracts()

  for (const chain of chains) {
    for (const lockContract of chain.wrapLockContracts) {
      if (lockContract.wrapLockContract !== 'w.ibc.alcor') continue // FIXME dev only

      const actions = await getXfers(chain, lockContract.wrapLockContract)

      const sequences = await getSequince(chain, lockContract.wrapLockContract, actions[0].trx_id)
      const provenList = await fetchProvenList(chains.find(c => c.name == lockContract.pairedChain), lockContract.pairedWrapTokenContract)

      for (const action of actions) {
        //if (action.trx_id !== '37458eaae20217eb0901c74b91a51189ad79ce3743d8a0186bf6c81795f1af1c') continue

        Object.assign(action, sequences)
        const digest = await getReceiptDigest(chain, action.receipts[0], action, true)
        const proven = provenList.includes(digest)

        if (!proven) {
          // TODO Prove function
          console.log(action.trx_id, action.act.data)
        }
      }
    }

    break
  }
}

main()
