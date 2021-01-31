import { captureException } from '@sentry/browser'

import Vue from 'vue'
import { asset } from 'eos-common'

import { EventBus } from '~/utils/event-bus'
import config from '~/config'
import { assetToAmount, amountToFloat } from '~/utils'

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
  created() {
    EventBus.$on('setPrice', price => {
      this.price = price
      this.priceChange()
    })

    EventBus.$on('setAmount', amount => {
      this.amount = amount
      this.amountChange()
    })

    EventBus.$on('setTotal', total => {
      this.total = total
      this.totalChange()
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
      console.log('watcher for limit eosPercent')
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
    priceChange () {
      const price = Math.max(parseFloat(this.price) || 0, 1 / 10 ** config.PRICE_DIGITS)
      this.price = price.toFixed(config.PRICE_DIGITS)
      this.total = (this.price * this.amount)
      this.amountChange()
    },

    amountChange (desc = false) {
      if (parseFloat(this.price) == 0) return

      const bp = this.base_token.symbol.precision
      const qp = this.quote_token.symbol.precision
      this.amount = (parseFloat(this.amount) || 0).toFixed(qp)

      const amount = asset(this.amount + ' TEST').amount
      const price = asset(this.price + ' TEST').amount

      const total = amount.multiply(correct_price(price, qp, bp)).divide(config.PRICE_SCALE)

      this.amount = amountToFloat(amount, qp)
      this.total = amountToFloat(total, bp)
    },

    totalChange (desc = false) {
      if (parseFloat(this.price) == 0) return

      const bp = this.base_token.symbol.precision
      const qp = this.quote_token.symbol.precision
      this.total = (parseFloat(this.total) || 0).toFixed(bp)

      const total = asset(this.total + ' TEST').amount
      const price = asset(this.price + ' TEST').amount
      const c_price = correct_price(price, qp, bp)

      const division = total.multiply(config.PRICE_SCALE).plus(c_price).minus(1).divide(c_price)

      this.amount = amountToFloat(division, qp)
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

      const loading = this.$loading({
        lock: true,
        text: 'Wait for wallet'
      })

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

        this.$store.dispatch('market/fetchOrders')
        this.$notify({ title: 'Buy', message: 'Order placed!', type: 'success' })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
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

        this.$store.dispatch('market/fetchOrders')
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

Vue.mixin({
  computed: {
    isMobile() {
      return this.$store.state.isMobile
    }
  },

  methods: {
    inputToAsset(input, precision) {
      return asset((parseFloat(input) || 0).toFixed(precision) + ' XXX')
    },

    toFixed(value, precision) {
      return (parseFloat(value) || 0).toFixed(precision)
    },

    monitorTx(tx) {
      const network = this.$store.state.network
      return `${network.monitor}/transaction/${tx}?tab=traces&${network.monitor_params}`
    },

    monitorAccount(account) {
      return `${this.$store.state.network.monitor}/account/${account}?${this.$store.state.network.monitor_params}`
    },

    openInNewTab(url) {
      const win = window.open(url, '_blank')
      win.focus()
    }
  }
})
