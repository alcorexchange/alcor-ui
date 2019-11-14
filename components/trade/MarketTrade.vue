<template lang="pug">
.row.p-2
  .col-lg-6
    .d-flex.label.mb-3
      span.text-success Buy {{ market.token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto balance: {{ eosBalance }}

    el-form(ref="form" label-width="60px")
      el-form-item(label="Price")
        el-input(type="number" disabled placeholder="Buy at best price")
          span(slot="suffix").mr-1 EOS

      el-form-item(label="Amount")
        el-input(type="number" clearable v-model="eos_amount" @change="update")
          span(slot="suffix").mr-1 EOS

      //el-form-item TODO
        el-slider(:step="25" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item.mt-1
        // TODO разработать компонент которой чекает залогинен ли
        el-button(type="success" size="small" @click="buy").w-100 Buy {{ market.token.str }}

  .col-lg-6
    .d-flex.label.mb-3
      span.text-danger Sell {{ market.token.symbol.name }}
      span.text-mutted.small.align-self-end.ml-auto balance: {{ tokenBalance }}

    el-form(ref="form" label-width="60px")
      el-form-item(label="Price")
        el-input(type="number" disabled placeholder="Buy at best price")
          span(slot="suffix").mr-1.ml-2 EOS

      el-form-item(label="Amount")
        el-input(type="number" v-model="token_amount" clearable @change="update")
          span(slot="suffix").mr-1 {{ market.token.symbol.name }}

      //el-form-item TODO
        el-slider(:step="25" show-stops :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}")

      el-form-item.mt-1
        // TODO разработать компонент которой чекает залогинен ли
        el-button(type="danger" size="small" @click="sell").w-100 Sell {{ market.token.str }}
</template>

<script>
// TODO Короче еще сделать для маркеттрейда размер в EOS сумировать по ордерам
import { captureException } from '@sentry/browser'
import { mapGetters } from 'vuex'
import { transfer } from '~/store/chain.js'

import config from '~/config'


export default {
  props: {
    market: {
      type: Object,
      default: () => {}
    },

    eosBalance: {
      type: String,
      default: () => {}
    },

    tokenBalance: {
      type: String,
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
    update() {
      this.eos_amount = parseFloat(this.eos_amount).toFixed(4)
      this.token_amount = parseFloat(this.token_amount).toFixed(this.market.token.symbol.precision)
    },

    async buy() {
      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        type: 'info'
      })

      const loading = this.$loading({ lock: true, text: 'Wait for Scatter' })

      if (this.$store.state.chain.scatterConnected && !this.$store.state.user)
        await this.$store.dispatch('chain/login')

      try {
        const r = await transfer(
          'eosio.token',
          this.user.name,

          `${this.eos_amount} EOS`,
          `${Number(0).toFixed(this.market.token.symbol.precision)} ${this.market.token.str}`
        )

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
            this.$emit('update')
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

    async sell() {
      if (!this.$store.state.chain.scatterConnected) return this.$notify({
        title: 'Authorization',
        message: 'Pleace connect Scatter',
        type: 'info'
      })

      const loading = this.$loading({ lock: true, text: 'Wait for Scatter' })

      if (this.$store.state.chain.scatterConnected && !this.$store.state.user)
        await this.$store.dispatch('chain/login')

      try {
        const r = await transfer(
          this.market.token.contract,
          this.user.name,

          `${this.token_amount} ${this.market.token.symbol.name}`,
          '0.0000 EOS@eosio.token'
        )
        this.$emit('update')

        this.$alert(`<a href="${config.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
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
