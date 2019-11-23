<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

el-card(v-if="!no_found" v-loading="loading").box-card.mt-3
  .clearfix(slot='header')
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page

    // Mobile
    .row
      .col-lg-1
        TokenImage(:src="$tokenLogo(market.token.symbol.name, market.token.contract)" height="40").mr-2.ml-1

      .col.d-none.d-lg-block
        h1.display-4 Trade {{ market.token.symbol.name }}@
          a(:href="market.token.contract | monitorAccount" target="_blank") {{ market.token.contract }}

          span  for EOS

  .lead.d-lg-none.mb-2 Trade {{ market.token.symbol.name }}@
    a(:href="market.token.contract | monitorAccount" target="_blank") {{ market.token.contract }}

    span  for EOS

  .text.item
    .row.trade-window
      .col-lg-5
        .overflowbox.no-bottom-border
          .blist
            .ltd.d-flex.justify-content-around
              span Price (EOS)
              span Amount({{ market.token.symbol.name }})
              span Total (EOS)

          .orders-list.blist.text-danger(ref="bids")
            .ltd.d-flex.justify-content-around(v-for="ask in sorted_asks" @click="setBid(ask)")
              span {{ ask.unit_price | humanFloat }}
              span {{ ask.bid.quantity.split(' ')[0] }}
              span {{ ask.ask.quantity }}

            .ltd.d-flex.justify-content-around(v-if="sorted_asks.length == 0")
              span
              span No asks
              span

          .bg-light.text-center.p-1
            //b.text-success(v-if="bids.length") {{ sorted_bids[0].price }}
            b.text-success {{ market.price }}

          .orders-list.blist.text-success
            .ltd.d-flex(v-for="bid in sorted_bids" @click="setAsk(bid)")
              span {{ bid.unit_price | humanFloat }}
              span {{ bid.ask.quantity.split(' ')[0] }}
              span {{ bid.bid.quantity }}

            .ltd.d-flex.justify-content-around(v-if="sorted_bids.length == 0")
              span
              span No bids
              span
      .col-lg-7
        el-tabs.h-100
          el-tab-pane(label="Limit trade")
            .row
              .col
                el-alert(title="Price can not be a floating point number!", v-show="wrongPrice" type='info', show-icon :closable="false")
                  | Please change price or amount. Price = Base amount / quoute amount
                  a(href="#", @click.prevent="unitPriceInfo").ml-1  WTF ?
            .row.p-2
              .col-lg-6
                .d-flex.label.mb-3
                  span.text-success Buy {{ market.token.symbol.name }}
                  span.text-mutted.small.align-self-end.ml-auto balance: {{ eosBalance }}

                el-form(ref="form" :rules="rules" label-width="60px")
                  el-form-item(label="Price")
                    el-input(type="number" min="0.00000001" step="0.00000001" v-model="price" clearable @change="calcPrice")
                      span(slot="suffix").mr-1 EOS

                  el-form-item(label="Amount")
                    el-input(type="number" v-model="amount" @change="calcPrice" clearable)
                      span(slot="suffix").mr-1 {{ market.token.symbol.name }}

                  el-form-item
                    el-slider(:step="25" @input="changeBuySlider" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

                  el-form-item(label="Total" prop="total" :inline-message="true").mt-5
                    el-input(type="number" v-model="totalEos")
                      span(slot="suffix").mr-1 EOS

                  el-form-item.mt-2
                    // TODO разработать компонент которой чекает залогинен ли
                    el-button(size="small" type="success" @click="buy").w-100 Buy {{ market.token.str }}

              .col-lg-6
                .d-flex.label.mb-3
                  span.text-danger Sell {{ market.token.symbol.name }}
                  span.text-mutted.small.align-self-end.ml-auto balance: {{ tokenBalance }}

                el-form(ref="form" :rules="rules" label-width="60px")
                  el-form-item(label="Price")
                    // FIXME Падает апп когда печатаешь сюда буквы
                    el-input(type="number" min="0" step="0.0001" value="0" v-model="price" clearable @change="calcPrice")
                      span(slot="suffix").mr-1.ml-2 EOS

                  el-form-item(label="Amount")
                    el-input(type="number" v-model="amount" clearable @change="calcPrice")
                      span(slot="suffix").mr-1 {{ market.token.symbol.name }}

                  el-form-item
                    el-slider(:step="25" @input="changeSellSlider" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

                  el-form-item(label="Total" prop="total" :inline-message="true").mt-5
                    el-input(type="number" v-model="totalEos")
                      span(slot="suffix").mr-1 EOS

                  el-form-item.mt-2
                    // TODO разработать компонент которой чекает залогинен ли
                    el-button(size="small" type="danger" @click="sell").w-100 Sell {{ market.token.str }}

          el-tab-pane(label="Market trade")
            market-trade(:market="market" @update="update" :eos-balance="eosBalance" :token-balance="tokenBalance")
    hr
    .row
      .col
        my-orders(@update="update" v-if="user")

    //hr
    //.el-row
      .el-col
        .lead History:
        el-table(:data='orders', style='width: 101%')
          el-table-column(label='Type', width='181')
            template(slot-scope='scope')
              span.text-success(v-if="scope.row.type == 'bid'") {{ scope.row.type }}
              span.text-danger(v-else) {{ scope.row.type }}

          el-table-column(label='Date', width='180')
            template(slot-scope='scope')
              i.el-icon-time
              span(style='margin-left: 10px') {{ scope.row.date }}

          el-table-column(label='Ask', width='180')
            template(slot-scope='scope')
              span {{ scope.row.ask.quantity }}

          el-table-column(label='Bid', width='180')
            template(slot-scope='scope')
              span {{ scope.row.bid.quantity }}

          el-table-column(label='Price', width='180')
            template(slot-scope='scope')
              span {{ scope.row.unit_price | humanFloat }}

          el-table-column(label='Operations' align="right")
            template(slot-scope='scope')
              el-button(size='mini', type='danger', @click='cancel(scope.row)') Cancel
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
import { mapGetters, mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import AssetImput from '~/components/elements/AssetInput'

import MarketTrade from '~/components/trade/MarketTrade'
import MyOrders from '~/components/trade/MyOrders'

import config from '~/config'
import { transfer, cancelorder } from '~/store/chain.js'
import { parseAsset, parseExtendedAsset, assetToAmount, sort_by_price } from '~/utils'
import { getSellOrders, getBuyOrders } from '~/api'

export default {

  components: {
    TokenImage,
    AssetImput,
    MarketTrade,
    MyOrders
  },

  data() {
    return {
      market: {},

      price: 0.0,
      amount: 0.0,

      no_found: false,
      loading: true,

      rules: {
        total: [{
          trigger: 'change',
          validator: (rule, value, callback) => {
            if (this.totalEos < 0.0005) {
              callback(new Error('Order amount must be more then 0.01 EOS'))
            }
          }
        }]
      }
    }
  },
  head() {
    return {
      title: `EOS Tokens | Market ${this.market.token.symbol.name}`,

      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        { hid: 'description', name: 'description', content: `Trade ${this.market.token.str} token for EOS` }
        //{ name: 'viewport', content: 'user-scalable = yes' }

      ]
    }
  },

  computed: {
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapGetters('market', ['sorted_asks', 'sorted_bids']),
    ...mapGetters(['user']),

    eosBalance() {
      // TODO В стейт
      if (!this.user || !this.user.balances) return '0.0000 EOS'

      const balance = this.user.balances.filter(b => b.currency === 'EOS')[0]
      if (!balance) return '0.0000 EOS'

      return `${balance.amount} ${balance.currency} EOS`
    },

    tokenBalance() {
      // TODO В стейт
      if (!this.user || !this.user.balances) return '0.0000'

      const balance = this.user.balances.filter((b) => {
        return b.currency === this.market.token.symbol.name &&
               b.contract === this.market.token.contract
      })[0]

      if (balance)
        return `${balance.amount} ${balance.currency}`
      else
        return Number(0).toFixed(this.market.token.symbol.precision) + ` ${this.market.token.symbol.name}`
    },

    market_id() {
      return parseInt(this.$route.params.id)
    },

    wrongPrice() {
      if (this.totalEos === 0.0 || !this.amount || !this.price) return false

      return assetToAmount(this.amount, 4) * assetToAmount(this.price, 8) % config.PRICE_SCALE !== 0
    },

    totalEos() {
      return (this.amount * this.price).toFixed(4)
    }
  },

  async asyncData({ store, error, params }) {
    const rpc = store.getters['chain/rpc']
    // TODO Читабельные урл

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

      if (market && market.id === params.id) {
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

  async created() {
    this.$store.commit('market/setId', this.market_id)
    await this.update()

    setTimeout(() => this.setDefaultPrice(), 2000)

    // Auto update orders
    setInterval(this.update, 5000)
  },

  methods: {
    setDefaultPrice() {
      this.price = this.$options.filters.humanFloat(
        this.$store.getters['market/price']
      )
    },

    changeBuySlider(p) {
      if (this.price === 0) return

      if (p === 100) {
        this.amount = parseFloat(this.eosBalance).toFixed(4)
      } else {
        this.amount = (Math.round(parseFloat(this.eosBalance) / 100 * p) / this.price).toFixed(4)
        this.update()
      }
    },

    changeSellSlider(p) {
      if (this.price === 0) return

      if (p === 100) {
        this.amount = parseFloat(this.tokenBalance).toFixed(this.market.token.symbol.precision)
      } else {
        this.amount = (Math.round(parseFloat(this.tokenBalance) / 100 * p)).toFixed(this.market.token.symbol.precision)
        this.update()
      }
    },

    setBid(ask) {
      this.price = this.$options.filters.humanFloat(ask.unit_price)
      this.amount = ask.bid.prefix
    },

    setAsk(bid) {
      this.price = this.$options.filters.humanFloat(bid.unit_price)
      this.amount = bid.ask.prefix
    },

    refresh() {
      this.calcPrice()
    },

    async update(amount) {
      this.$store.dispatch('update')
      await this.$store.dispatch('market/fetchMarket')
    },

    calcPrice(amount) {
      if (!this.amount) {
        this.price = parseFloat(this.price).toFixed(config.PRICE_DIGITS)
        this.amount = Number(0).toFixed(this.market.token.symbol.precision)

        return
      }

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
        captureException(e, { extra: { order } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async sell() {
      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        duration: 0,
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

        this.update()

        this.$notify({
          title: 'Place order',
          message: `<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`,
          dangerouslyUseHTMLString: true,
          duration: 0,
          type: 'success'
        })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error', duration: 0 })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    async buy() {
      // TODO Обновляем баланс после каждой сделки
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

        this.update()
        this.$notify({
          title: 'Place order',
          message: `<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`,
          dangerouslyUseHTMLString: true,
          duration: 0,
          type: 'success'
        })

        //this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
        //  dangerouslyUseHTMLString: true,
        //  confirmButtonText: 'OK',
        //  callback: (action) => {
        //    // this.$router.push({ name: 'index' })
        //    // this.$notify({ title: 'Success', message: `You fill ${id} order`, type: 'success' })
        //  }
        //})
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error', duration: 0 })
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

.orders-list.blist .ltd:hover {
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

.display-4 {
  font-size: 2.5rem;
  font-weight: 230;
  line-height: 1;
}

@media only screen and (max-width: 420px) {
  .blist .ltd span {
    font-size: 10px;
  }

  .display-4 {
    font-size: 1em;
  }
}

</style>
