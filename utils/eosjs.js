const MAX_PAGINATION_FETCHES = 10

import fetch from 'node-fetch'
import { JsonRpc as JsonRpcMultiEnds } from '../assets/libs/eosjs-jsonrpc'
import { shuffleArray } from './index'


export function getMultyEndRpc(nodes) {
  shuffleArray(nodes)
  nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)
  const rpc = new JsonRpcMultiEnds(nodes, { fetch })

  return rpc
}

export const fetchAllRows =
  async (rpc, options, indexName = 'id') => {
    const mergedOptions = {
      json: true,
      lower_bound: 0,
      upper_bound: undefined,
      limit: 9999,
      ...options
    }

    let rows = []
    let lowerBound = mergedOptions.lower_bound

    /* eslint-disable no-await-in-loop */
    for (let i = 0; i < MAX_PAGINATION_FETCHES; i += 1) {
      const result = await rpc.get_table_rows({
        ...mergedOptions,
        lower_bound: lowerBound
      })
      rows = rows.concat(result.rows)

      if (!result.more || result.rows.length === 0) break

      // EOS 2.0 api
      if (typeof result.next_key !== 'undefined') {
        lowerBound = result.next_key
      } else {
        lowerBound =
          Number.parseInt(
            `${result.rows[result.rows.length - 1][indexName]}`,
            10
          ) + 1
      }
    }

    return rows
  }

export const fetchAllScopes = async (rpc, contract, table) => {
  const mergedOptions = {
    json: true,
    lower_bound: undefined,
    upper_bound: undefined,
    limit: 9999,
    code: contract,
    table
  }

  const rows = (await rpc.get_table_by_scope(mergedOptions)).rows
  return rows.map((row) => row.scope)
}
