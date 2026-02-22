const MAX_PAGINATION_FETCHES = 500

import fetch from 'cross-fetch'
import { JsonRpc as JsonRpcMultiEnds } from '../assets/libs/eosjs-jsonrpc'

import config from '../config'

export function getChainRpc(chain) {
  const directEnvKey = `${String(chain).toUpperCase()}_DIRECT_NODE`
  const directNode = process.env[directEnvKey]
  const nodes = Object.keys(config.networks[chain].client_nodes)

  // Sort alcor nodes first among public nodes
  nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

  // Direct node always first — must be after sort to stay on top
  if (directNode) {
    nodes.unshift(directNode)
  }

  return getMultyEndRpc(nodes, false)
}

export function getMultyEndRpc(nodes, alcorSorted = true) {
  //shuffleArray(nodes)
  if (alcorSorted) nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)
  const rpc = new JsonRpcMultiEnds(nodes, { fetch })

  return rpc
}

export const fetchAllRows = async (
  rpc,
  options,
  indexName = 'id'
) => {
  const mergedOptions = {
    json: true,
    lower_bound: 0,
    upper_bound: undefined,
    limit: 9999,
    ...options,
  }

  let rows = []
  let lowerBound = mergedOptions.lower_bound

  for (let i = 0; i < MAX_PAGINATION_FETCHES; i += 1) {
    const result = await rpc.get_table_rows({
      ...mergedOptions,
      lower_bound: lowerBound,
    })

    rows = rows.concat(result.rows)

    if (!result.more || result.rows.length === 0) break

    // EOS 2.0 api
    // TODO Add 'more' key
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

  const scopes = []
  let lowerBound = mergedOptions.lower_bound

  for (let i = 0; i < MAX_PAGINATION_FETCHES; i += 1) {
    const result = await rpc.get_table_by_scope({
      ...mergedOptions,
      lower_bound: lowerBound,
    })

    if (Array.isArray(result.rows) && result.rows.length > 0) {
      scopes.push(...result.rows.map((row) => row.scope))
    }

    const nextKey = (typeof result.more === 'string' && result.more.length > 0)
      ? result.more
      : (typeof result.next_key === 'string' && result.next_key.length > 0 ? result.next_key : null)

    if (!nextKey || result.rows.length === 0) break
    lowerBound = nextKey
  }

  return scopes
}
