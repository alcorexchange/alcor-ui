import { captureException } from '@sentry/browser'

import { asset } from 'eos-common'

import config from '~/config'
import { amountToFloat } from '~/utils'


// TODO This whole module need refactor

function correct_price(price, _from, _for) {
  const diff_precision = Math.abs(_from - _for)

  if (_from < _for) {
    price = price.multiply(10 ** diff_precision)
  } else if (_from > _for) {
    price = price.divide(10 ** diff_precision)
  }

  return price
}

export const tradeChangeEvents = {
  mounted() {
    this.$nuxt.$on('setPrice', price => {
      this.price = price

      const _price = Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS)
      this.price = _price.toFixed(config.PRICE_DIGITS)
      this.total = (this.price * this.amount)

      this.priceChange()
    })

    this.$nuxt.$on('setAmount', amount => {
      this.amount = amount
      this.amountChange()
    })
  }
}

export const tradeMixin = {
  data() {
    return {
      price: 0.0,
      total: 0.0,
      amount: 0.0,

      eosPercent: 0,
      tokenPercent: 0,

      rules: {
        total: [{
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (this.totalEos < 0.0005) {
              callback(new Error(`Order amount must be more then 0.01 ${this.network.baseToken.symbol}@${this.network.baseToken.contract}`))
            }
          }
        }]
      }
    }
  },

  watch: {
    eosPercent(v) {
      if (!this.baseBalance) return

      const balance = parseFloat(this.baseBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.total = balance
      } else {
        this.total = (balance / 100 * v)
      }

      this.total = parseFloat(this.total).toFixed(this.base_token.symbol.precision)
      this.totalChange()
    },

    tokenPercent(v) {
      console.log('watcher for limit tokenPercent')
      if (!this.tokenBalance) return

      const balance = parseFloat(this.tokenBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.amount = balance
      } else {
        this.amount = (balance / 100 * v)
      }

      this.amount = parseFloat(this.amount).toFixed(this.quote_token.symbol.precision)
      this.amountChange()
    }
  },

  methods: {
    fixPrice() {
      const price = Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS)
      this.price = price.toFixed(config.PRICE_DIGITS)
      this.amountChange()
      console.log('on fix price')
    },

    priceChange() {
      //const price = Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS)
      //this.price = price.toFixed(config.PRICE_DIGITS)
      //this.total = (this.price * this.amount)
      //this.amountChange()

      //const price = Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS)
      //this.total = (price.toFixed(config.PRICE_DIGITS) * this.amount)
      this.amountChange(false, true)
    },

    onSetAmount(balance) {
      this.amount = balance
      this.amountChange()
    },

    setPrecisions() {
      const bp = this.base_token.symbol.precision
      const qp = this.quote_token.symbol.precision

      this.amount = (parseFloat(this.amount) || 0).toFixed(qp)
      this.total = (parseFloat(this.total) || 0).toFixed(bp)
    },

    amountChange(desc = false, toFloat = true) {
      // TODO Сделать обновление в реалтайм
      if (parseFloat(this.price) == 0) return

      const bp = this.base_token.symbol.precision
      const qp = this.quote_token.symbol.precision

      const amount = asset((parseFloat(this.amount) || 0).toFixed(qp) + ' TEST').amount
      const price = asset(Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS).toFixed(config.PRICE_DIGITS) + ' TEST').amount

      // TODO and FIXME the price calculation is wrong here..
      //console.log('amount', amount, price, qp, bp, correct_price(price, qp, bp))
      const total = amount.multiply(correct_price(price, qp, bp)).divide(config.PRICE_SCALE)

      //this.amount = toFloat ? amountToFloat(amount, qp) : parseFloat(amount)
      this.total = toFloat ? amountToFloat(total, bp) : parseFloat(total)
    },

    totalChange(desc = false, toFloat = true) {
      // TODO Сделать обновление в реалтайм
      if (parseFloat(this.price) == 0) return

      const bp = this.base_token.symbol.precision
      const qp = this.quote_token.symbol.precision

      const total = asset((parseFloat(this.total) || 0).toFixed(bp) + ' TEST').amount
      const price = asset(Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS).toFixed(config.PRICE_DIGITS) + ' TEST').amount
      const c_price = correct_price(price, qp, bp)

      const division = total.multiply(config.PRICE_SCALE).plus(c_price).minus(1).divide(c_price)

      this.amount = toFloat ? amountToFloat(division, qp) : parseFloat(division)
    },

    async buy(type) {
      if (!await this.$store.dispatch('chain/asyncLogin')) return

      if (type == 'limit') {
        this.amount = parseFloat(this.amount).toFixed(this.quote_token.symbol.precision)
        this.total = parseFloat(this.total).toFixed(this.base_token.symbol.precision)
      } else {
        this.amount = parseFloat(0).toFixed(this.quote_token.symbol.precision)
        this.total = parseFloat(this.total).toFixed(this.base_token.symbol.precision)
      }


      const actions = [
        {
          account: this.base_token.contract,
          name: 'transfer',
          authorization: [this.user.authorization],
          data: {
            from: this.user.name,
            to: this.network.contract,
            quantity: `${this.total} ${this.base_token.symbol.name}`,
            memo: `${this.amount} ${this.quote_token.str}`
          }
        }
      ]

      try {
        await this.$store.dispatch('chain/sendTransaction', actions)

        setTimeout(() => {
          this.$store.dispatch('loadUserBalances')
          this.$store.dispatch('market/loadUserOrders')
          this.$store.dispatch('market/fetchOrders')
        }, 1000)

        this.$notify({ title: 'Buy', message: 'Order placed!', type: 'success' })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e, type: 'error' })
        console.log(e)
      } finally {
      }
    },

    async sell(type) {
      if (!await this.$store.dispatch('chain/asyncLogin')) return

      if (type == 'limit') {
        this.amount = parseFloat(this.amount).toFixed(this.quote_token.symbol.precision)
        this.total = parseFloat(this.total).toFixed(this.base_token.symbol.precision)
      } else {
        this.amount = parseFloat(this.amount).toFixed(this.quote_token.symbol.precision)
        this.total = parseFloat(0).toFixed(this.base_token.symbol.precision)
      }

      const loading = this.$loading({
        lock: true,
        text: 'Wait for wallet'
      })

      try {
        await this.$store.dispatch('chain/transfer', {
          contract: this.quote_token.contract,
          actor: this.user.name,
          quantity: `${this.amount} ${this.quote_token.symbol.name}`,
          memo: `${this.total} ${this.base_token.symbol.name}@${this.base_token.contract}`
        })

        setTimeout(() => {
          this.$store.dispatch('loadUserBalances')
          this.$store.dispatch('market/loadUserOrders')
          this.$store.dispatch('market/fetchOrders')
        }, 1000)

        this.$notify({ title: 'Sell', message: 'Order placed!', type: 'success' })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
