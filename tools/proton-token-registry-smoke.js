#!/usr/bin/env node

/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { Serializer, Asset, UInt64 } = require('@wharfkit/antelope')

const fetchImpl = typeof fetch === 'function' ? fetch : require('cross-fetch')

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

function argValue(flag, fallback = '') {
  const idx = process.argv.indexOf(flag)
  if (idx === -1 || idx + 1 >= process.argv.length) return fallback
  return process.argv[idx + 1]
}

function toBool(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const normalized = String(value || '').toLowerCase().trim()
  return normalized === '1' || normalized === 'true' || normalized === 'yes'
}

function stringifyField(value) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function decodeRow(rawHex) {
  let decoded
  try {
    decoded = Serializer.decode({
      abi: TOKEN_REGISTRY_ROW_ABI,
      data: rawHex,
      type: TOKEN_REGISTRY_ROW_TYPE,
    })
  } catch (error) {
    return {
      ok: false,
      skipped: {
        id: '',
        contract: '',
        symbolRaw: '',
        reason: `decode_failed:${String(error?.message || error || '')}`,
      },
    }
  }

  const id = stringifyField(decoded.id)
  const contract = stringifyField(decoded.tcontract)
  const symbolRaw = stringifyField(decoded.symbol_raw)

  try {
    const symbol = Asset.Symbol.from(UInt64.from(symbolRaw || '0')).toString()
    const [, symbolCode = symbol] = symbol.split(',')

    return {
      ok: true,
      row: {
        id,
        tcontract: contract,
        tname: stringifyField(decoded.tname),
        url: stringifyField(decoded.url),
        desc: stringifyField(decoded.desc),
        iconurl: stringifyField(decoded.iconurl),
        symbol,
        symbolCode: String(symbolCode || '').trim().toUpperCase(),
        blisted: toBool(decoded.blisted),
      },
    }
  } catch (error) {
    return {
      ok: false,
      skipped: {
        id,
        contract,
        symbolRaw,
        reason: `invalid_symbol:${String(error?.message || error || '')}`,
      },
    }
  }
}

async function fetchPage(endpoint, lowerBound, limit) {
  const response = await fetchImpl(`${endpoint}/v1/chain/get_table_rows`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      json: false,
      code: TOKEN_REGISTRY_CONTRACT,
      scope: TOKEN_REGISTRY_CONTRACT,
      table: TOKEN_REGISTRY_TABLE,
      lower_bound: String(lowerBound),
      limit,
    }),
  })

  const text = await response.text()
  const parsed = JSON.parse(text)
  if (!response.ok || parsed?.error) {
    const message = parsed?.error?.details?.[0]?.message || parsed?.error?.what || text
    throw new Error(`get_table_rows failed at lower_bound=${lowerBound}: ${message}`)
  }

  return parsed
}

async function main() {
  const endpoint = argValue('--endpoint', 'https://proton-api.alcor.exchange').replace(/\/+$/, '')
  const limit = Number(argValue('--limit', '1000')) || 1000
  const validOut = argValue('--valid-out', '')
  const skippedOut = argValue('--skipped-out', '')

  let lowerBound = argValue('--lower-bound', '0')
  let page = 0
  let totalRawRows = 0

  const validRows = []
  const skippedRows = []

  for (;;) {
    const data = await fetchPage(endpoint, lowerBound, limit)
    const rows = Array.isArray(data?.rows) ? data.rows : []
    if (rows.length === 0) break

    for (const rawRow of rows) {
      totalRawRows += 1

      if (typeof rawRow !== 'string') {
        skippedRows.push({
          id: '',
          contract: '',
          symbolRaw: '',
          reason: `unexpected_row_type:${typeof rawRow}`,
        })
        continue
      }

      const decoded = decodeRow(rawRow)
      if (decoded.ok) validRows.push(decoded.row)
      else skippedRows.push(decoded.skipped)
    }

    page += 1
    const nextKey = String(data?.next_key || '')
    if (page % 5 === 0) {
      console.log(`[progress] pages=${page} raw=${totalRawRows} valid=${validRows.length} skipped=${skippedRows.length}`)
    }

    if (!data?.more || !nextKey) break
    lowerBound = nextKey
  }

  if (validOut) {
    const target = path.resolve(validOut)
    fs.writeFileSync(target, JSON.stringify(validRows, null, 2))
    console.log(`[file] valid rows saved: ${target}`)
  }

  if (skippedOut) {
    const target = path.resolve(skippedOut)
    fs.writeFileSync(target, JSON.stringify(skippedRows, null, 2))
    console.log(`[file] skipped rows saved: ${target}`)
  }

  console.log('--- proton token registry smoke ---')
  console.log(`endpoint: ${endpoint}`)
  console.log(`pages: ${page}`)
  console.log(`raw rows: ${totalRawRows}`)
  console.log(`valid rows: ${validRows.length}`)
  console.log(`skipped rows: ${skippedRows.length}`)
  console.log('skipped sample:', skippedRows.slice(0, 10))
  console.log('valid sample:', validRows.slice(0, 10).map(r => ({
    id: r.id,
    symbol: r.symbol,
    contract: r.tcontract,
    blacklisted: r.blisted,
  })))
}

main().catch((error) => {
  console.error('[smoke] failed:', error?.message || error)
  process.exit(1)
})

