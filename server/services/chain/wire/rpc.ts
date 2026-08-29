import { JsonRpc } from '../../../../assets/libs/eosjs-jsonrpc'
import { wireFetch } from './transport'

// Wire keeps contract tables in KV storage, so /v1/chain/get_table_rows differs
// from Antelope in two ways that every call site would otherwise have to know:
//
//   1. rows arrive wrapped as {key, value} instead of the flat row object;
//   2. bounds are JSON objects encoded as strings. A scalar `lower_bound: 0` is
//      rejected with 500 bad_cast_exception ("Invalid cast from 'uint64_type' to
//      Object"), and `next_key` comes back as '{"primary_key":4294967236}'.
//
// Both are undone here so fetchAllRows and its callers stay chain-agnostic.

function encodeBound(bound: any): string {
  if (bound === undefined || bound === null || bound === '') return ''

  // Already the JSON form the node emits in next_key — hand it straight back.
  if (typeof bound === 'string' && bound.startsWith('{')) return bound

  return JSON.stringify({ primary_key: Number(bound) })
}

function unwrapRow(row: any): any {
  if (!row || typeof row !== 'object' || !('key' in row) || !('value' in row)) return row

  // The scope only rides along inside `key` when the query left scope out, which
  // is how Wire lets you sweep every scope of a table in one paginated call.
  const { scope } = row.key || {}

  return scope === undefined ? row.value : { ...row.value, scope }
}

export class WireJsonRpc extends JsonRpc {
  constructor(endpoints: string | string[], args: any = {}) {
    super(endpoints, { fetch: wireFetch, ...args })
  }

  async get_table_rows(options: any): Promise<any> {
    const result = await super.get_table_rows({
      ...options,
      lower_bound: encodeBound(options.lower_bound),
      upper_bound: encodeBound(options.upper_bound),
    })

    return { ...result, rows: (result.rows || []).map(unwrapRow) }
  }
}
