import { Router } from 'express'
import { Match } from '../../models'

export const account = Router()

account.get('/:account/deals', async (req, res) => {
  const network = req.app.get('network')
  const { account } = req.params
  const { from, to, limit = 500, skip = 0, market } = req.query

  const baseMatch = { chain: network.name }

  if (market) {
    baseMatch.market = parseInt(market, 10)
  }

  if (from && to) {
    baseMatch.time = {
      $gte: new Date(parseFloat(from) * 1000),
      $lte: new Date(parseFloat(to) * 1000),
    }
  }

  // Запрос для asker
  const askerQuery = [
    { $match: { ...baseMatch, asker: account } },
    { $sort: { time: -1 } },
    {
      $project: {
        time: 1,
        bid: 1,
        ask: 1,
        unit_price: 1,
        trx_id: 1,
        market: 1,
        type: 1,
        bidder: 1,
        asker: 1,
      },
    },
    { $skip: parseInt(skip, 10) },
    { $limit: parseInt(limit, 10) },
  ]

  // Запрос для bidder
  const bidderQuery = [
    { $match: { ...baseMatch, bidder: account } },
    { $sort: { time: -1 } },
    {
      $project: {
        time: 1,
        bid: 1,
        ask: 1,
        unit_price: 1,
        trx_id: 1,
        market: 1,
        type: 1,
        bidder: 1,
        asker: 1,
      },
    },
    { $skip: parseInt(skip, 10) },
    { $limit: parseInt(limit, 10) },
  ]

  try {
    // Параллельное выполнение обоих запросов
    const [askerResults, bidderResults] = await Promise.all([Match.aggregate(askerQuery), Match.aggregate(bidderQuery)])

    // Объединяем результаты и сортируем по времени
    const combinedResults = [...askerResults, ...bidderResults]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit)

    res.json(combinedResults)
  } catch (error) {
    console.error('Error fetching deals:', error)
    res.status(500).json({ error: 'An error occurred while fetching deals.' })
  }
})
