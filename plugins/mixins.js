import { captureException } from '@sentry/browser'

import Vue from 'vue'
import { EventBus } from '~/utils/event-bus'
import config from '~/config'
import { assetToAmount, amountToFloat } from '~/utils'

function correct_price(price, _from, _for) {
  const diff_precision = Math.abs(_from - _for)

  if (_from < _for) {
    price *= 10 ** diff_precision
  } else if (_from > _for) {
    price /= 10 ** diff_precision
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
      if (!this.baseBalance) return

      const balance = parseFloat(this.baseBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.total = balance
        this.totalChange(true)
      } else {
        this.total = (balance / 100 * v).toFixed(this.network.baseToken.precision)
        this.totalChange()
      }
    },

    tokenPercent(v) {
      if (!this.tokenBalance) return

      const balance = parseFloat(this.tokenBalance.split(' ')[0])

      if (balance == 0) return

      if (v === 100) {
        this.amount = balance
        this.amountChange(true)
      } else {
        this.amount = (balance / 100 * v).toFixed(this.token.symbol.precision)
        this.amountChange()
      }
    }
  },

  methods: {
    getValidAmount(amount_str, desc = false) {
      const bp = this.network.baseToken.precision
      const qp = this.token.symbol.precision

      let amount = assetToAmount(amount_str, qp) || 1

      const price = assetToAmount(this.price, 8)

      const pp = parseFloat(this.price).toString().split('.')
      let price_numbers = pp[1] ? pp[1].length : 0

      price_numbers = qp - bp + price_numbers

      const step = 10 ** price_numbers

      //let min_amount_number_precision = Math.min(qp, bp)

      //let min_amount = Math.pow(10, price_numbers)
      //min_amount = correct_price(min_amount, min_amount_number_precision, qp)

      //console.log('min_amount', min_amount)

      //if (amount < min_amount) {
      //  amount = min_amount
      //}

      //let minimum_tolal = assetToAmount(Math.round(parseFloat(this.price * Math.pow(10, bp))) / Math.pow(10, bp), bp) || 1
      //console.log('minimum_tolal', minimum_tolal, Math.round(minimum_tolal / 10))

      ////let min_amount = minimum_tolal * correct_price(price, bp, qp) / config.PRICE_SCALE
      ////console.log('min_amount', min_amount)

      for (let i = 1000; ; i--) {
        if (i === 0) {
          console.log('a lot itertions')
          // TODO Notify.create('Calculate better amount not possible, try onter amount or pirce')
          break
        }

        if (amount * correct_price(price, qp, bp) % config.PRICE_SCALE !== 0) {
          amount = Math.round(amount / step) * step
          if (desc) {
            amount -= step
          } else {
            amount += step
          }
          continue
        }

        break
      }

      const total = amount * correct_price(price, qp, bp) / config.PRICE_SCALE

      return [amountToFloat(amount, qp), amountToFloat(total, bp)]
    },

    priceChange () {
      const price = Math.max(parseFloat(this.price) || 1, 1 / 10 ** config.PRICE_DIGITS)
      this.price = price.toFixed(config.PRICE_DIGITS)
      this.total = (this.price * this.amount)
      this.amountChange()
    },

    amountChange (desc = false) {
      this.amount = parseFloat(this.amount) || 1

      if (this.price == 0) return

      const [amount, total] = this.getValidAmount(this.amount, desc)

      this.amount = amount
      this.total = total
    },

    totalChange (desc = false) {
      this.total = parseFloat(this.total) || 1

      if (this.price == 0) return

      const [amount, total] = this.getValidAmount(this.total / this.price, desc)

      this.amount = amount
      this.total = total
    },

    async buy() {
      this.amount = parseFloat(this.amount).toFixed(this.token.symbol.precision)
      this.total = parseFloat(this.total).toFixed(this.network.baseToken.precision)

      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        type: 'info'
      })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      if (this.$store.state.chain.scatterConnected && !this.$store.state.user)
        await this.$store.dispatch('chain/login')

      try {
        const r = await this.$store.dispatch('chain/transfer', {
          contract: this.network.baseToken.contract,
          actor: this.user.name,
          quantity: `${this.total} ${this.network.baseToken.symbol}`,
          memo: `${this.amount} ${this.token.str}`
        })

        this.$store.dispatch('market/fetchMarket')

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
          }
        })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async sell() {
      this.amount = parseFloat(this.amount).toFixed(this.token.symbol.precision)
      this.total = parseFloat(this.total).toFixed(this.network.baseToken.precision)

      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        type: 'info'
      })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      if (this.$store.state.chain.scatterConnected && !this.$store.state.user)
        await this.$store.dispatch('chain/login')

      try {
        const r = await this.$store.dispatch('chain/transfer', {
          contract: this.token.contract,
          actor: this.user.name,
          quantity: `${this.amount} ${this.token.symbol.name}`,
          memo: `${this.total} ${this.network.baseToken.symbol}@${this.network.baseToken.contract}`
        })

        this.$store.dispatch('market/fetchMarket')

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
          }
        })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}

Vue.mixin({
  methods: {
    monitorAccount(account) {
      return `${this.$store.state.network.monitor}/account/${account}?${this.$store.state.network.monitor_params}`
    },

    unitPriceInfo() {
      this.$alert(
        `Since the price calculation is calculated using int64 value,
        then with increasing accuracy of quantity or price,
        the price can be a floating point period. At the moment,
        the floating point price is not supported.
        It can not be stored in contract RAM
        We are sorry :(`,

        'The price is floating point number', {
          closeOnClickModal: true,
          confirmButtonText: 'Ok!'
        }
      )
    }
  }
})
