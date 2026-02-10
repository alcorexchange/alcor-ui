import { Router } from 'express'
import { cacheSeconds } from 'route-cache'
import axios from 'axios'

import { getChainRpc, fetchAllRows } from '../../../utils/eosjs'
import { getScamLists } from './config'

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 1000
const DEFAULT_PRICE_DIGITS = 8
const OTC_MATCH_FEE_MULTIPLIER = 0.9975

export const otc = Router()

function clampLimit(value: unknown) {
  const parsed = Number.parseInt(String(value || DEFAULT_LIMIT), 10)
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT
  if (parsed < 1) return 1
  if (parsed > MAX_LIMIT) return MAX_LIMIT
  return parsed
}

function parseOffset(value: unknown) {
  const parsed = Number.parseInt(String(value || 0), 10)
  if (!Number.isFinite(parsed) || parsed < 0) return 0
  return parsed
}

function parseSortOrder(value: unknown): 'asc' | 'desc' {
  return String(value || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
}

function parseOtcAsset(asset) {
  if (asset && Object.prototype.hasOwnProperty.call(asset, 'symbol') && Object.prototype.hasOwnProperty.call(asset, 'contract')) {
    const amount = Number.parseFloat(asset.amount)
    const normalizedAmount = Number.isFinite(amount) ? amount : 0

    return {
      symbol: asset.symbol,
      contract: asset.contract,
      amount: normalizedAmount,
      quantity: `${normalizedAmount.toFixed(4)} ${asset.symbol}`,
      str: `${asset.symbol}@${asset.contract}`
    }
  }

  const quantity = String(asset?.quantity || '0.0000 UNKNOWN')
  const [amountRaw = '0', symbol = 'UNKNOWN'] = quantity.split(' ')
  const amount = Number.parseFloat(amountRaw)
  const normalizedAmount = Number.isFinite(amount) ? amount : 0
  const contract = String(asset?.contract || '')

  return {
    symbol,
    contract,
    amount: normalizedAmount,
    quantity: `${normalizedAmount.toFixed(4)} ${symbol}`,
    str: `${symbol}@${contract}`
  }
}

function calculatePrice(sell, buy) {
  let first = parseOtcAsset(buy)
  let second = parseOtcAsset(sell)

  if (second.symbol === 'EOS' && sell?.contract === 'eosio.token') {
    ;[first, second] = [second, first]
  }

  if (!second.amount) return `0.${'0'.repeat(DEFAULT_PRICE_DIGITS)} ${first.symbol}`

  const price = (first.amount / second.amount).toFixed(DEFAULT_PRICE_DIGITS)
  return `${price} ${first.symbol}`
}

function enrichOrder(row) {
  const buy = parseOtcAsset(row.buy)
  const sell = parseOtcAsset(row.sell)

  return {
    ...row,
    buy,
    sell,
    price: calculatePrice(row.sell, row.buy)
  }
}

function isScamOrder(order, scamContracts: Set<string>, scamTokens: Set<string>) {
  const buyId = `${order.buy.symbol.toLowerCase()}-${order.buy.contract}`
  const sellId = `${order.sell.symbol.toLowerCase()}-${order.sell.contract}`

  return (
    scamContracts.has(order.buy.contract) ||
    scamContracts.has(order.sell.contract) ||
    scamTokens.has(buyId) ||
    scamTokens.has(sellId)
  )
}

function applyOrderSort(items, sortBy: string, sortOrder: 'asc' | 'desc') {
  const sorted = [...items]
  const direction = sortOrder === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    if (sortBy === 'price') {
      const ap = Number.parseFloat(String(a.price).split(' ')[0])
      const bp = Number.parseFloat(String(b.price).split(' ')[0])
      return (ap - bp) * direction
    }

    if (sortBy === 'buy') return (a.buy.amount - b.buy.amount) * direction
    if (sortBy === 'sell') return (a.sell.amount - b.sell.amount) * direction
    if (sortBy === 'maker') return String(a.maker).localeCompare(String(b.maker)) * direction

    return (Number(a.id) - Number(b.id)) * direction
  })

  return sorted
}

async function loadOtcOrders(network: Network) {
  const rpc = getChainRpc(network.name)
  const contract = network.otc.contract

  const rows = await fetchAllRows(rpc, {
    code: contract,
    scope: contract,
    table: 'orders',
    limit: 1000
  })

  return rows.map(enrichOrder)
}

otc.get('/orders', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const limit = clampLimit(req.query.limit)
  const offset = parseOffset(req.query.offset)
  const search = String(req.query.search || '').trim().toLowerCase()
  const maker = String(req.query.maker || '').trim().toLowerCase()
  const token = String(req.query.token || '').trim().toLowerCase()
  const sellToken = String(req.query.sell_token || '').trim().toLowerCase()
  const buyToken = String(req.query.buy_token || '').trim().toLowerCase()
  const sortBy = String(req.query.sort || 'id').toLowerCase()
  const sortOrder = parseSortOrder(req.query.order)
  const hideScam = String(req.query.hide_scam ?? 'true') !== 'false'

  let items = await loadOtcOrders(network)

  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    items = items.filter(order => !isScamOrder(order, scam_contracts, scam_tokens))
  }

  if (maker) {
    items = items.filter(order => String(order.maker).toLowerCase().includes(maker))
  }

  if (token) {
    items = items.filter(order => {
      const buy = `${order.buy.symbol}@${order.buy.contract}`.toLowerCase()
      const sell = `${order.sell.symbol}@${order.sell.contract}`.toLowerCase()
      return buy === token || sell === token
    })
  }

  if (sellToken) {
    // Format: symbol-contract (e.g. tlm-alien.worlds) -> match against sell side
    const [sym, contract] = sellToken.split('-')
    items = items.filter(order =>
      order.sell.symbol.toLowerCase() === sym && order.sell.contract.toLowerCase() === contract
    )
  }

  if (buyToken) {
    const [sym, contract] = buyToken.split('-')
    items = items.filter(order =>
      order.buy.symbol.toLowerCase() === sym && order.buy.contract.toLowerCase() === contract
    )
  }

  if (search) {
    items = items.filter(order => {
      const haystack = [
        String(order.id),
        String(order.maker || ''),
        `${order.buy.symbol}@${order.buy.contract}`,
        `${order.sell.symbol}@${order.sell.contract}`,
        String(order.price || '')
      ].join(' ').toLowerCase()

      return haystack.includes(search)
    })
  }

  items = applyOrderSort(items, sortBy, sortOrder)

  const total = items.length
  const paged = items.slice(offset, offset + limit)

  res.json({
    items: paged,
    total,
    limit,
    offset,
    has_more: offset + paged.length < total
  })
})

otc.get('/orders/:id', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const rpc = getChainRpc(network.name)
  const contract = network.otc.contract
  const orderId = Number.parseInt(req.params.id, 10)

  if (!Number.isFinite(orderId)) return res.status(400).send('Invalid order id')

  const { rows } = await rpc.get_table_rows({
    code: contract,
    scope: contract,
    table: 'orders',
    lower_bound: String(orderId),
    limit: 1
  })

  const row = rows[0]
  if (!row || Number(row.id) !== orderId) return res.status(404).send('Order not found')

  const order = enrichOrder(row)

  const { scam_contracts, scam_tokens } = await getScamLists(network)

  res.json({
    ...order,
    is_scam: isScamOrder(order, scam_contracts, scam_tokens)
  })
})

otc.get('/tokens', cacheSeconds(5, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const hideScam = String(req.query.hide_scam ?? 'true') !== 'false'

  let items = await loadOtcOrders(network)

  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    items = items.filter(order => !isScamOrder(order, scam_contracts, scam_tokens))
  }

  const tokens = new Set<string>()
  items.forEach(order => {
    tokens.add(`${order.buy.symbol}@${order.buy.contract}`)
    tokens.add(`${order.sell.symbol}@${order.sell.contract}`)
  })

  res.json(Array.from(tokens).sort((a, b) => a.localeCompare(b)))
})

otc.get('/history', cacheSeconds(2, (req, res) => {
  return req.originalUrl + '|' + req.app.get('network').name
}), async (req, res) => {
  const network: Network = req.app.get('network')
  const limit = clampLimit(req.query.limit || 50)
  const offset = parseOffset(req.query.offset)
  const search = String(req.query.search || '').trim().toLowerCase()
  const sortBy = String(req.query.sort || 'time').toLowerCase()
  const sortOrder = parseSortOrder(req.query.order)
  const hideScam = String(req.query.hide_scam ?? 'true') !== 'false'
  const contract = network.otc.contract

  const { data } = await axios.get(`${network.hyperion}/v2/history/get_actions`, {
    params: {
      account: contract,
      limit,
      skip: offset,
      filter: `${contract}:matchrecord`
    },
    timeout: 15000
  })

  const actions = data?.actions || []

  let items = actions
    .map((action) => ({ time: action['@timestamp'], ...action.act?.data?.record }))
    .map((row) => {
      const buy = parseOtcAsset(row.buy)
      const sell = parseOtcAsset(row.sell)

      return {
        ...row,
        buy: {
          ...buy,
          amount: buy.amount / OTC_MATCH_FEE_MULTIPLIER,
          quantity: `${(buy.amount / OTC_MATCH_FEE_MULTIPLIER).toFixed(4)} ${buy.symbol}`,
        },
        sell: {
          ...sell,
          amount: sell.amount / OTC_MATCH_FEE_MULTIPLIER,
          quantity: `${(sell.amount / OTC_MATCH_FEE_MULTIPLIER).toFixed(4)} ${sell.symbol}`,
        },
        price: calculatePrice(sell, buy)
      }
    })

  if (hideScam) {
    const { scam_contracts, scam_tokens } = await getScamLists(network)
    items = items.filter(order => !isScamOrder(order, scam_contracts, scam_tokens))
  }

  if (search) {
    items = items.filter(row => {
      const haystack = [
        String(row.maker || ''),
        String(row.buyer || ''),
        `${row.buy.symbol}@${row.buy.contract}`,
        `${row.sell.symbol}@${row.sell.contract}`,
        String(row.price || '')
      ].join(' ').toLowerCase()

      return haystack.includes(search)
    })
  }

  if (sortBy === 'price' || sortBy === 'buy' || sortBy === 'sell' || sortBy === 'time') {
    const direction = sortOrder === 'asc' ? 1 : -1
    items = [...items].sort((a, b) => {
      if (sortBy === 'price') {
        const ap = Number.parseFloat(String(a.price).split(' ')[0])
        const bp = Number.parseFloat(String(b.price).split(' ')[0])
        return (ap - bp) * direction
      }

      if (sortBy === 'buy') return (a.buy.amount - b.buy.amount) * direction
      if (sortBy === 'sell') return (a.sell.amount - b.sell.amount) * direction

      return (new Date(a.time).getTime() - new Date(b.time).getTime()) * direction
    })
  }

  res.json({
    items,
    total: data?.total?.value ?? items.length,
    limit,
    offset,
    has_more: Boolean(data?.actions?.length === limit)
  })
})
