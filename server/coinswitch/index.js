import axios from 'axios'
import axiosRetry from 'axios-retry'
import { cacheSeconds } from 'route-cache'
axiosRetry(axios, { retries: 3 })

import { Router } from 'express'

import { Order } from './models'

export const cs = Router()

const coinswitch = axios.create({
  baseURL: 'https://api.coinswitch.co/v2',
  timeout: 30000,

  headers: {
    'x-api-key': 'cRbHFJTlL6aSfZ0K2q7nj6MgV5Ih4hbA2fUG0ueO', // TODO For prod and dev condition
    'x-user-ip': '109.252.48.123'
  }
})

cs.get('/coins', async (req, res) => {
  const { data } = await coinswitch.get('/coins')
  res.json(data)
})

cs.get('/pairs', cacheSeconds(60 * 60), async (req, res) => {
  const destinationCoin = 'eos'
  const { data: pairs } = await coinswitch.post('/pairs', { destinationCoin })
  const { data: coins } = await coinswitch.get('/coins')

  if (pairs.success && coins.success) {
    pairs.data.map(p => {
      p.depositCoin = coins.data.filter(c => c.symbol == p.depositCoin)[0]
      p.destinationCoin = coins.data.filter(c => c.symbol == destinationCoin)[0]
    })
    return res.json(pairs)
  }

  res.json({ success: false })
})

cs.get('/rate', async (req, res) => {
  const { data } = await coinswitch.post('/rate', { depositCoin: 'eth', destinationCoin: 'eos' })
  res.json(data)
})

cs.post('/order', async (req, res) => {
  const { creator, device_id, depositCoin, destinationAddress, depositCoinAmount } = req.body
  if (!destinationAddress) return res.json({ success: false, msg: 'Set destinationAddress' })
  if (!depositCoin) return res.json({ success: false, msg: 'Set depositCoin' })
  if (!device_id) return res.json({ success: false, msg: 'Set device_id' })

  const { data } = await coinswitch.post('/order',
    {
      depositCoin,
      depositCoinAmount,
      destinationCoin: 'eos',
      destinationAddress: {
        address: destinationAddress,
        tag: 'TODO Это походу мемо тут'
      }
    }
  )

  if (!data.success) {
    return res.json(data)
  }

  const { data: order } = await coinswitch.get(`/order/${data.data.orderId}`)
  if (order.success) Order.create({
    device_id,
    creator,
    ...order.data
  })

  res.json(order)
})

cs.get('/order/:order_id', async (req, res) => {
  const { order_id } = req.params

  const { data } = await coinswitch.get(`/order/${order_id}`)
  res.json(data)
})
