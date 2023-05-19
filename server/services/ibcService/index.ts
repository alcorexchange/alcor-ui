import { SymbolCode } from 'eos-common'

import { networks } from '../../../config'

import { getMultyEndRpc } from '../../../utils/eosjs'
//import { IBC_NETWORKS } from '~/config'
import { nameToUint64 } from '../../../utils'

//const supportedNetworks = ['eos', 'wax', 'proton', 'ux']
const supportedNetworks = ['eos']

const chains = {}

for (const network of Object.values(networks).filter((v: any) =>
  supportedNetworks.includes(v.name)
) as any[]) {
  const nodes = Object.keys(network.client_nodes)
  nodes.sort((a, b) => (a.includes('alcor') ? -1 : 1))

  chains[network.name] = {
    network,
    rpc: getMultyEndRpc(nodes),
  }
}

async function loadTokens(chainName: string) {
  const rpc = chains[chainName].rpc

  const wrapLockContracts = []
  for (const lockContract of chains[chainName].network.ibc
    .wrapLockContractsArray) {
    const {
      rows: [global],
    } = await rpc.get_table_rows({
      code: lockContract,
      scope: lockContract,
      table: 'global',
    })

    const { rows: tokens } = await rpc.get_table_rows({
      code: lockContract,
      scope: lockContract,
      table: 'contractmap',
    })

    for (const token of tokens) {
      const chain: any = Object.values(chains).find(
        (c: any) => c.network.chainId === global.chain_id
      )

      if (!chain) continue

      const { rows } = await chain.rpc.get_table_by_scope({
        code: token.native_token_contract,
        table: 'stat',
      })

      const symbols = rows.map((r) =>
        new SymbolCode(Number(nameToUint64(r.scope))).toString()
      )

      wrapLockContracts.push({
        chain_id: global.chain_id,
        wrapLockContract: lockContract,
        nativeTokenContract: token.native_token_contract,
        pairedChainId: global.paired_chain_id,
        pairedWrapTokenContract: token.paired_wraptoken_contract,
        symbols,
      })
    }
  }

  chains[chainName].wrapLockContracts = wrapLockContracts
}

async function streamTransfer() {}


function stream(contracts) {
  // url = f'{self.api_endpoint}/v2/history/get_actions'
  // params = {
  //     'sort': 'asc',
  //     'after': self.last_irreversible_action_time.strftime('%Y-%m-%dT%H:%M:%SZ'),
  //     'skip': qi * self.row_limit,
  //     'limit': self.row_limit,
  //     'checkLib': 'true'
  // }
  // if self.filter_param:
  //     params['filter'] = self.filter_param
  // response = requests.get(url, params=params, timeout=20)
  // response = response.json()
}


async function main() {
  for (const chain of supportedNetworks) {
    await loadTokens(chain)
  }

  for (const chain of Object.values(chains) as any[]) {
    console.log(chain.network.ibc, chain.wrapLockContracts)
  }

  // if (tokenRow.native)
  //   url = `${sourceChain.hyperion}/v2/history/get_actions?account=${tokenRow.wrapLockContract}&filter=${tokenRow.nativeTokenContract}:transfer&transfer.from=${sourceChain.auth.actor}&transfer.memo=${destinationChain.auth.actor}&limit=15`
  // else
  //   url = `${sourceChain.hyperion}/v2/history/get_actions?account=${sourceChain.auth.actor}&filter=${tokenRow.pairedWrapTokenContract}:retire&limit=15`
}

main()
