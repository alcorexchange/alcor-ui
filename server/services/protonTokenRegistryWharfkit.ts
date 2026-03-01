import { Asset, Serializer, UInt64 } from '@wharfkit/antelope'
import { fetchAllRows } from '../../utils/eosjs'
import { getFailOverAlcorOnlyRpc } from '../utils'

const TOKEN_REGISTRY_CONTRACT = 'token.proton'
const TOKEN_REGISTRY_TABLE = 'tokens'
const TOKEN_REGISTRY_ROW_TYPE = 'token_registry_row_raw'

const TOKEN_REGISTRY_ROW_ABI = {
  version: 'eosio::abi/1.2',
  types: [],
  structs: [
    {
      name: TOKEN_REGISTRY_ROW_TYPE,
      base: '',
      fields: [
        { name: 'id', type: 'uint64' },
        { name: 'tcontract', type: 'name' },
        { name: 'tname', type: 'string' },
        { name: 'url', type: 'string' },
        { name: 'desc', type: 'string' },
        { name: 'iconurl', type: 'string' },
        // Decode as uint64 to safely handle invalid precision values.
        { name: 'symbol_raw', type: 'uint64' },
        { name: 'blisted', type: 'bool' },
      ],
    },
  ],
  actions: [],
  tables: [],
  ricardian_clauses: [],
  variants: [],
  action_results: [],
}

type DecodedTokenRegistryRow = {
  id?: any
  tcontract?: any
  tname?: any
  url?: any
  desc?: any
  iconurl?: any
  symbol_raw?: any
  blisted?: any
}

export type ProtonTokenRegistryRawRow = {
  id?: number | string
  tcontract?: string
  tname?: string
  url?: string
  desc?: string
  iconurl?: string
  symbol?: string
  blisted?: boolean | number | string
}

export type ProtonTokenRegistrySkippedRow = {
  id: string
  contract: string
  symbolRaw: string
  reason: string
}

function stringifyField(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function decodeTokenRegistryRow(rawHex: string): {
  row: ProtonTokenRegistryRawRow | null
  skipped: ProtonTokenRegistrySkippedRow | null
} {
  let decoded: DecodedTokenRegistryRow

  try {
    decoded = Serializer.decode({
      abi: TOKEN_REGISTRY_ROW_ABI as any,
      data: rawHex,
      type: TOKEN_REGISTRY_ROW_TYPE,
    }) as unknown as DecodedTokenRegistryRow
  } catch (error) {
    return {
      row: null,
      skipped: {
        id: '',
        contract: '',
        symbolRaw: '',
        reason: `decode_failed:${String((error as any)?.message || error || '')}`,
      },
    }
  }

  const id = stringifyField(decoded.id)
  const contract = stringifyField(decoded.tcontract)
  const symbolRaw = stringifyField(decoded.symbol_raw)

  try {
    const symbol = Asset.Symbol.from(UInt64.from(symbolRaw || '0')).toString()

    return {
      row: {
        id,
        tcontract: contract,
        tname: stringifyField(decoded.tname),
        url: stringifyField(decoded.url),
        desc: stringifyField(decoded.desc),
        iconurl: stringifyField(decoded.iconurl),
        symbol,
        blisted: decoded.blisted,
      },
      skipped: null,
    }
  } catch (error) {
    return {
      row: null,
      skipped: {
        id,
        contract,
        symbolRaw,
        reason: `invalid_symbol:${String((error as any)?.message || error || '')}`,
      },
    }
  }
}

export async function fetchProtonTokenRegistryRowsWharfkit(network: any): Promise<{
  rows: ProtonTokenRegistryRawRow[]
  skipped: ProtonTokenRegistrySkippedRow[]
}> {
  const rpc = getFailOverAlcorOnlyRpc(network)
  const rawRows = await fetchAllRows(rpc, {
    json: false,
    code: TOKEN_REGISTRY_CONTRACT,
    scope: TOKEN_REGISTRY_CONTRACT,
    table: TOKEN_REGISTRY_TABLE,
    limit: 1000,
  })

  const rows: ProtonTokenRegistryRawRow[] = []
  const skipped: ProtonTokenRegistrySkippedRow[] = []

  for (const rawRow of rawRows) {
    if (typeof rawRow !== 'string') {
      skipped.push({
        id: '',
        contract: '',
        symbolRaw: '',
        reason: `unexpected_row_type:${typeof rawRow}`,
      })
      continue
    }

    const decoded = decodeTokenRegistryRow(rawRow)
    if (decoded.row) rows.push(decoded.row)
    if (decoded.skipped) skipped.push(decoded.skipped)
  }

  return { rows, skipped }
}
