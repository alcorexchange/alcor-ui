import { JsonRpc } from '../../../../assets/libs/eosjs-jsonrpc'
import { wireFetch } from './transport'

// Wire keeps contract tables in KV storage, so /v1/chain/get_table_rows differs
// from Antelope in four ways that every call site would otherwise have to know:
//
//   1. rows arrive wrapped as {key, value} instead of the flat row object;
//   2. bounds are JSON objects encoded as strings. A scalar `lower_bound: 0` is
//      rejected with 500 bad_cast_exception ("Invalid cast from 'uint64_type' to
//      Object"), and `next_key` comes back as '{"primary_key":4294967236}';
//   3. `upper_bound` is exclusive, where Antelope's is inclusive. The universal
//      `lower_bound === upper_bound === id` idiom for "give me exactly this row"
//      therefore returns nothing at all — silently, as an empty table would;
//   4. a scope is read as a name first and only falls back to uint64 when that
//      fails, the reverse of Antelope. Scope `1` is therefore read as name('1')
//      — 576460752303423488, a scope nothing lives in — and the query comes back
//      empty just as silently. Tables scoped by pool id (positions, ticks) are
//      the ones that care.
//
// All four are undone here so fetchAllRows and its callers stay chain-agnostic.

const NAME_CHARS = '.12345abcdefghijklmnopqrstuvwxyz'

// The last of a name's 13 characters carries 4 bits, the other twelve carry 5.
function uint64ToName(value: bigint): string {
  const chars: string[] = []

  let rest = value
  for (let i = 12; i >= 0; i--) {
    const bits = BigInt(i === 12 ? 4 : 5)
    const mask = (BigInt(1) << bits) - BigInt(1)

    chars[i] = NAME_CHARS[Number(rest & mask)]
    rest >>= bits
  }

  return chars.join('').replace(/\.+$/, '')
}

function encodeScope(scope: any): any {
  if (typeof scope !== 'number' && typeof scope !== 'bigint') return scope

  // Zero's name form is the empty string, and an empty scope means "every scope"
  // to Wire. Decimal '0' has no name character in it, so the uint64 fallback —
  // the one path that reads it as the number it is — catches it.
  if (Number(scope) === 0) return '0'

  return uint64ToName(BigInt(scope))
}

function encodeBound(bound: any, inclusive = false): string {
  if (bound === undefined || bound === null || bound === '') return ''

  // Already the JSON form the node emits in next_key — hand it straight back.
  if (typeof bound === 'string' && bound.startsWith('{')) return bound

  // BigInt rather than Number: keys run the full uint64 range, and one holding
  // an encoded name loses its low bits as a double.
  return `{"primary_key":${BigInt(bound) + BigInt(inclusive ? 1 : 0)}}`
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
      scope: encodeScope(options.scope),
      lower_bound: encodeBound(options.lower_bound),
      upper_bound: encodeBound(options.upper_bound, true),
    })

    return { ...result, rows: (result.rows || []).map(unwrapRow) }
  }
}
