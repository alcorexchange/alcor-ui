<template lang="pug">
// TODO Make this shit done
div
  .row
    .col
      el-alert(title="Amounts does't match unit price!", v-show="wrongPrice" type='info', show-icon :closable="false")
        | Please change price or amount.
        a(href="#", @click.prevent="wtf").ml-1  WTF ?
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
</template>

 <script>
import { captureException } from '@sentry/browser'
import { mapGetters } from 'vuex'
import { transfer } from '~/store/chain.js'

import config from '~/config'


export default {
  props: {
    market: {
      type: Object,
      default: () => {}
    }
  },

  data() {
    return {
      eos_amount: 0.0,
      token_amount: 0.0
    }
  },

  computed: {
    ...mapGetters(['user'])
  },

   methods: {
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
