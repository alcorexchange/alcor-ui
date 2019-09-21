<template lang="pug">

el-card(v-if="!no_found" v-loading="loading").box-card.mt-3
  .clearfix(slot='header')
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page

    .row
      .el-col.ml-2
        TokenImage(:src="$tokenLogo(market.token.symbol.name, market.token.symbol.name)" height="45").mr-2.ml-1
      .el-col.d-flex.align-items-center
        h1.display-4 Trade {{ market.token.symbol.name }}@
          a(:href="market.token.symbol.contract | monitorAccount" target="_blank") {{ market.token.contract }}

          span  for EOS

    //a(:href="order.maker | monitorAccount" target="_blank") {{ order.maker }}


  //.text.item(v-if="order.maker")
  .text.item
    .row.trade-window
      .col-5

        .overflowbox.no-bottom-border
          .blist
            .ltd.d-flex.justify-content-around
              span Price (EOS)
              span Amt({{ market.token.symbol.name }})
              span Total (EOS)

        .overflowbox
          .blist.text-danger(ref="bids")
            .ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
              span {{ ask.unit_price | humanFloat }}
              span {{ ask.bid.quantity }}
              span {{ ask.ask.quantity }}

            .ltd.d-flex.justify-content-around(v-if="sorted_asks.length == 0")
              span
              span No asks
              span

          .bg-light.text-center.p-1
            b.text-success(v-if="bids.length") {{ sorted_bids[0].price }}

          .blist.text-success
            .ltd.d-flex(v-for="bid in sorted_bids" @click="setAsk(bid)")
              span {{ bid.unit_price | humanFloat }}
              span {{ bid.ask.quantity }}
              span {{ bid.bid.quantity }}

            .ltd.d-flex.justify-content-around(v-if="sorted_bids.length == 0")
              span
              span No bids
              span
      .col-7
        el-tabs.h-100
          el-tab-pane(label="Limit trade")
            .row
              .col
                el-alert(title="Amounts does't match unit price!", v-show="wrongPrice" type='info', show-icon :closable="false")
                  | Please change price or amount.
                  a(href="#", @click="wtf").ml-1  WTF ?
            .row.p-2

              .col
                .label.text-success.mb-3 Buy {{ market.token.symbol.name }}

                el-form(ref="form" :rules="rules" label-width="60px")
                  el-form-item(label="Price")
                    el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="update")
                      span(slot="suffix").mr-1 EOS

                  el-form-item(label="Amount")
                    el-input(type="number" v-model="amount" @change="update" clearable)
                      span(slot="suffix").mr-1 {{ market.token.symbol.name }}

                  el-form-item
                    el-slider(:step="25" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

                  el-form-item(label="Total" prop="total" :inline-message="true").mt-5
                    el-input(type="number" v-model="totalEos" @change="setTotalBuy")
                      span(slot="suffix").mr-1 EOS

                  el-form-item.mt-2
                    // TODO разработать компонент которой чекает залогинен ли
                    el-button(type="success" @click="buy").w-100 Buy {{ market.token.str }}

              .col
                .label.text-danger.mb-3 Sell {{ market.token.symbol.name }}

                el-form(ref="form" :rules="rules" label-width="60px")
                  el-form-item(label="Price")
                    // FIXME Падает апп когда печатаешь сюда буквы
                    el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="update")
                      span(slot="suffix").mr-1.ml-2 EOS

                  el-form-item(label="Amount")
                    el-input(type="number" v-model="amount" clearable @change="update")
                      span(slot="suffix").mr-1 {{ market.token.symbol.name }}

                  el-form-item
                    el-slider(:step="25" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

                  el-form-item(label="Total" prop="total" :inline-message="true").mt-5
                    el-input(type="number" v-model="totalEos" @change="setTotalSell")
                      span(slot="suffix").mr-1 EOS

                  el-form-item.mt-2
                    // TODO разработать компонент которой чекает залогинен ли
                    el-button(type="danger" @click="sell").w-100 Sell {{ market.token.str }}

          el-tab-pane(label="Market trade")
            market-trade(:market="market" @update="fetchOrders")
    hr
    .el-row
      .el-col
        my-orders(:market_id="market_id" :asks="asks" :bids="bids" @update="fetchOrders")

  //div
    div(v-if="user")
      el-button(v-if="user && order.maker == user.name" type="warning" @click="cancelOrder").w-100 Cancel order
      el-button(v-else type="primary" @click="buy").w-100 Buy
        |  {{ order.sell.quantity }}@{{ order.sell.contract }}
    div(v-else)
      el-button(@click="login").w-100 Pleace login


el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Market: {{ market.id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center
    h1.display-4 Order {{ market.id }} not found or finished
</template>


<script>
import { captureException } from '@sentry/browser'
import { mapGetters } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import AssetImput from '~/components/elements/AssetInput'

import MarketTrade from '~/components/trade/MarketTrade'
import MyOrders from '~/components/trade/MyOrders'



import config from '~/config'
import { transfer, cancelorder } from '~/store/chain.js'
import { parseAsset, parseExtendedAsset, assetToAmount } from '~/utils'



const sort_by_price = (a, b) => (a.unit_price < b.unit_price) ? 1 : ((b.unit_price < a.unit_price) ? -1 : 0)

export default {
  head() {
    return {
      title: `EOSLESS | Market ${this.market.token.toString()}`
    }
  },

  components: {
    TokenImage,
    AssetImput,
    MarketTrade,
    MyOrders
  },

  data() {
    return {
      market: {},

      bids: [],
      asks: [],

      price: 0.0,
      amount: 0.0,

      no_found: false,
      loading: true,

      rules: {
        total: [{ trigger: 'change',
          validator: (rule, value, callback) => {
            if (this.totalEos < 0.0005) {
              callback(new Error('Order amount must be more then 0.01 EOS'))
            }
          }
        }]
      }
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapGetters(['user']),

    market_id() {
      return parseInt(this.$route.params.id)
    },

    wrongPrice() {
      if (this.totalEos == 0.0) return false

      return assetToAmount(this.amount, 4) * assetToAmount(this.price, 8) % config.PRICE_SCALE != 0
    },

    sorted_asks() {
      return this.asks.slice().sort(sort_by_price)
    },

    sorted_bids() {
      return this.bids.slice().sort(sort_by_price)
    },

    totalEos() {
      // bid_eos.amount * PRICE_SCALE / ask.amount
      // 0.00510035
      // 142.5000 TKT
      // 0.7268 EOS
      // console.log(assetToAmount(0.00510035, 8), assetToAmount("0.00510035", 8))
      // console.log(assetToAmount(this.amount, 4) * assetToAmount(this.price, 8) / PRICE_SCALE)
      // console.log("TOTAL EOS ", assetToAmount(this.price, 8) / (assetToAmount(this.amount, 4)))
      console.log()


      /// console.log((this.amount * this.price).toFixed(4))
      return (this.amount * this.price).toFixed(4)
    }
  },

  async asyncData({ store, error, params }) {
    const rpc = store.getters['chain/rpc']

    // const [token, contract] = params.id.split('@')

    // let i128_key = Buffer.from(contract).contoString('hex') + Buffer.from("symbol").toString('hex');

    // let b = Buffer.alloc(128)

    // let i128_key = '0x' + b.concat([Buffer.from(contract), Buffer.from("symbol")]).toString('hex');

    // console.log(i128_key)

    try {
      const r = await rpc.get_table_rows({
        code: config.contract,
        scope: config.contract,
        table: 'markets',
        // key_type: 'i128',
        // encode_type: 'hex',
        // index_position: '2',
        // lower_bound: i128_key,
        lower_bound: params.id, // FIXME Сделать короче по uint128 поиск
        limit: 1
      })

      r.rows.map(r => r.token = parseExtendedAsset(r.token))

      const market = r.rows[0]

      if (market && market.id == params.id) {
        return { market, loading: false }
      } else {
        // TODO Redirect if order in history
        error({ message: `Market with id ${params.id} not found or closed :(`, statusCode: 404 })
      }
    } catch (e) {
      captureException(e)
      return error({ message: 'Error fetching order: ' + e, statusCode: 500 })
    }
  },

  mounted() {
    // FIXME не работает скролинг чето
    const bids = this.$refs.bids
    setTimeout(() => {
      bids.scrollTop = bids.scrollHeight
    }, 1000)
  },

  created() {
    this.update()
    this.fetchOrders()
  },

  methods: {
    wtf() {
      // TODO Move from here
      this.$alert(
        `Since the price calculation is calculated using int64 value,
        then with increasing accuracy of quantity or price,
        the price can be a floating point period. At the moment,
        this price format is not supported. We are sorry :( `,

        'About calculation of price', {
          closeOnClickModal: true,
          confirmButtonText: 'Ok then..'
      })
    },

    async fetchOrders() {
      const { rows: bids } = await this.rpc.get_table_rows({
        code: config.contract,
        scope: this.market_id,
        table: 'buyorder',
        limit: 1000
      })

      const { rows: asks } = await this.rpc.get_table_rows({
        code: config.contract,
        scope: this.market_id,
        table: 'sellorder',
        limit: 1000
      })

      this.bids = bids.map((b) => {
        b.ask = parseAsset(b.ask)
        b.bid = parseAsset(b.bid)

        return b
      })

      this.asks = asks.map((b) => {
        b.ask = parseAsset(b.ask)
        b.bid = parseAsset(b.bid)
        return b
      })
    },

    setBid(ask) {
      this.price = this.$options.filters.humanFloat(ask.unit_price)
      this.amount = ask.bid.prefix
    },

    setAsk(bid) {
      this.price = this.$options.filters.humanFloat(bid.unit_price)
      this.amount = bid.ask.prefix
    },

    setTotalBuy() {
      // TODO Remove this methods
    },

    setTotalSell() {

    },

    update(amount) {
      this.price = parseFloat(this.price).toFixed(config.PRICE_DIGITS)


      this.amount = parseFloat(this.amount).toFixed(this.market.token.symbol.precision)
    },

    async login() {
      this.loading = true

      try {
        await this.$store.dispatch('chain/login')
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Loading error', message: e.message, type: 'error' })
      } finally {
        this.loading = false
      }
    },

    async cancelOrder(order) {
      if (!this.user) return this.$notify({ title: 'Authorization', message: 'Pleace login first', type: 'info' })

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        const order = this.order

        await cancelorder(order.maker, order.id)

        this.$notify({ title: 'Success', message: `Order canceled ${order.id}`, type: 'success' })
        this.$router.push({ name: 'index' })
      } catch (e) {
        captureException(e, {extra: { order }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async fetchOrder() {
    },

    async sell() {
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
        const r = await transfer(
          this.market.token.contract,
          this.user.name,
          `${this.amount} ${this.market.token.symbol.name}`,
          `${this.totalEos} EOS@eosio.token`
        )

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
            this.fetchOrders()

            // this.$router.push({ name: 'index' })
            // this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
          }
        })
      } catch (e) {
        captureException(e, {extra: { order: this.order }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async buy() {
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
        const r = await transfer(
          'eosio.token',
          this.user.name,

          `${this.totalEos} EOS`,
          `${this.amount} ${this.market.token.str}`
        )

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
            this.fetchOrders()
            // this.$router.push({ name: 'index' })
            // this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
          }
        })
      } catch (e) {
        captureException(e, {extra: { order: this.order }})
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
</script>

<style>
.bordered {
  border-right: 1px solid;
}

.trade-window {
  min-height: 400px;
}

.el-form-item {
  margin-bottom: 0px;
}

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.overflowbox {
  border: 1px solid hsla(0,2%,89%,.7);
  box-shadow: none;
}

.blist {
  max-height: 200px;
  overflow: auto;
  padding: 5px 15px;
  text-align: right;
}


.blist .ltd {
  position: relative;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-pack: center;
  justify-content: center;
  -ms-flex-align: center;
  align-items: center;
  height: 20.6px;
  line-height: 20.6px;
  overflow: hidden;
}

.blist .ltd:hover {
  cursor: pointer;
  font-weight: bold;
}

.blist .ltd span {
  width: 40%;
  font-size: 14px;
}

.blist .ltd span:first-child {
  text-align: left;
}

.no-bottom-border {
}

.display-4 {
  font-size: 2.5rem;
  font-weight: 230;
  line-height: 1;
}

</style>
