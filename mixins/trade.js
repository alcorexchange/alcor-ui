import { mapActions, mapState, mapGetters } from 'vuex'
import { Big } from 'big.js'
import { popup } from '~/mixins/popup'

export const trade = {
  mixins: [popup],

  watch: {
    price: {
      handler(current, old) {
        // first time getting price - We could use socket on init function --> market/init ?
        if (parseFloat(current) && !parseFloat(old)) {
          this.priceBid = current
        }
      },
      immediate: true
    }
  },

  computed: {
    ...mapState('market', [
      'price_bid',
      'base_token',
      'quote_token',
      'amount_buy',
      'amount_sell',
      'percent_buy',
      'percent_sell',
      'total_buy',
      'total_sell'
    ]),
    ...mapGetters('market', [
      'baseBalance',
      'tokenBalance',
      'sorted_asks',
      'sorted_bids',
      'price'
    ]),
    priceBid: {
      get() { return this.price_bid },
      set(val) { this.changePrice(val) }
    },
    amountBuy: {
      get() { return this.amount_buy },
      set(val) { this.changeAmount({ amount: val, type: 'buy' }) }
    },
    amountSell: {
      get() { return this.amount_sell },
      set(val) { this.changeAmount({ amount: val, type: 'sell' }) }
    },

    percentBuy: {
      get() { return this.percent_buy },
      set(val) {
        if (val == 100) {
          this.$store.commit('market/SET_PERCENT_BUY', 100)
          this.setAmount('buy')
        } else {
          this.changePercentBuy({ percent: val })
        }
      }
    },

    percentSell: {
      get() { return this.percent_sell },
      set(val) { this.changePercentSell(val) }
    },

    totalBuy: {
      get() { return this.total_buy },
      set(val) { this.changeTotal({ total: val, type: 'buy' }) }
    },
    totalSell: {
      get() { return this.total_sell },
      set(val) { this.changeTotal({ total: val, type: 'sell' }) }
    },

    getSpreadNum() {
      const latestAsk = this.sorted_asks[0]
      const latestBid = this.sorted_bids[0]

      if (!latestAsk || !latestBid) return 0

      const spreadDec = latestAsk[0] - latestBid[0]
      return spreadDec
    },

    getSpreadPercent() {
      const latestAsk = this.sorted_asks[0]
      if (!latestAsk) return 0

      const spreadDec = this.getSpreadNum / latestAsk[0] * 100
      const spread = Math.round(spreadDec * 100) / 100
      return spread
    }
  },

  methods: {
    ...mapActions('market', [
      'changePrice',
      'setPrecisionPrice',
      'setPrecisionTotalBuy',
      'setPrecisionTotalSell',
      'changeTotal',
      'changeAmount',
      'setPrecisionAmountBuy',
      'setPrecisionAmountSell',
      'changePercentBuy',
      'changePercentSell',
      'fetchBuy',
      'fetchSell',
      'calcAndSetTotal'
    ]),
    setAmount(bid) {
      if (bid == 'buy') {
        if (parseFloat(this.price_bid) == 0 || this.price_bid == null || isNaN(this.price_bid)) return

        this.changeTotal({ total: this.baseBalance, type: 'buy' })

        setTimeout(() => {
          // Doing this to get lower total (because it rounds up when corrected price happen)
          // we do this because user want to buy for his balance amount, so round up will exeed balance
          const prec = this.quote_token.symbol.precision
          const amount = Big(this.amount_buy).minus(1 / (10 ** prec))
          this.$store.commit('market/SET_AMOUNT_BUY', amount.toString())

          this.calcAndSetTotal()
        }, 0)
      } else {
        this.changeAmount({ amount: this.tokenBalance, type: 'sell' })
      }
    },

    sendFetchBid(trade, bid) {
      let res
      if (bid == 'buy') res = this.fetchBuy(trade)
      else res = this.fetchSell(trade)

      return res
    },

    async actionOrder(trade, bid) {
      if (!this.$store.state.user?.name) {
        // TODO replace with please login button
        try {
          if (!await this.$store.dispatch('chain/mainLogin', null, { root: true })) return
        } catch (e) { return }
      }

      if (trade !== 'market' && (parseFloat(this.price_bid) == 0 || this.price_bid == null || isNaN(this.price_bid))) {
        this.$notify({ title: 'Place order', message: 'Specify the price', type: 'error' })
        return
      }

      if (trade !== 'market' && bid == 'buy' && (parseFloat(this.total_buy) == 0 || this.total_buy == null || isNaN(this.total_buy))) {
        this.$notify({ title: 'Place order', message: 'Specify the number and total amount of', type: 'error' })
        return
      } else if (trade !== 'market' && bid == 'sell' && (parseFloat(this.amount_sell) == 0 || this.amount_sell == null || isNaN(this.amount_sell))) {
        this.$notify({ title: 'Place order', message: 'Specify the number of', type: 'error' })
        return
      }

      if (trade == 'market' && this.getSpreadPercent > 10) {
        const confInfo = {
          title: 'Spread is above 10%!',
          mess: 'Using a limit order is recommended. The bid / ask spread is over 10%. Do you want to continue with a market order?'
        }
        const actionCancel = await this.showPopupWarning(confInfo, 'Trade')
        if (actionCancel) return
      }

      const res = await this.sendFetchBid(trade, bid)

      if (res.err) {
        this.$notify({ title: 'Place order', message: res.desc, type: 'error' })
      } else {
        this.$notify({ title: bid == 'buy' ? 'Buy' : 'Sell', message: 'Order placed!', type: 'success' })
      }
    }
  }
}
