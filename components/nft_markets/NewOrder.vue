<template lang="pug">
// TODO Refactor with walidators for form
div
  el-button(size="medium" type="primary" @click="open").w-100  Sell NFT's

  el-dialog(title="Create new order", :visible.sync="visible" width="50%" v-if="user")
    .row
      .col
        .nft(v-for="nft in sell")
    el-form(label-position="left")
      el-button(type="primary" icon="el-icon-circle-plus-outline") Add NFT

    //el-form(ref="form" :model="form" label-position="left" :rules="rules")
      // TODO Bit symbol and amount here
      h1.leader Sell

      el-form-item(label="Sell NFT")
        el-select(v-model="tokenSelect", value-key="id" filterable clearable placeholder='Sell token' @change="sellSellToken").w-100
          el-option(v-for="b in userNfts" :key="b.id", :value="b" :label="`${b.id} ->  ${b.amount} ${b.currency}`")
            //TokenImage(:src="$tokenLogo(b.currency, b.contract)" height="25")
            //span.ml-3 {{ b.id }}
            //span.float-right {{ `${b.amount} ${b.currency}` }}

      el-form-item(v-if="tokenSelect" label="Token amount")
        el-input-number(v-model="form.sell.amount" :max="form.sell.maxAmount" :precision="form.sell.precision" :step="1").mt-2.w-100

        //el-input-number(v-model="form.buy.amount" :precision="4" :step="1").mt-2.w-100

      div(v-if="form.sell.amount > 0")
        hr

        h1.leader Buy

        el-tabs
          el-tab-pane(label="Auto select")
            el-select(v-model='sellSelect' value-key="id" filterable placeholder='Select' clearable @change="setBuyToken").w-100
              el-option(:label="`${baseToken.symbol}@${baseToken.contract}`"
                        :value="{symbol: baseToken.symbol, contract: baseToken.contract, precision: baseToken.precision}")
                TokenImage(:src="$tokenLogo(baseToken.symbol, baseToken.contract)" height="25")
                span.ml-3 {{ baseToken.symbol }}@{{ baseToken.contract }}

              el-option(
                v-for="t in tokens",
                :key="t.id",
                :label="t.id",
                :value="t"
              )
                TokenImage(:src="$tokenLogo(t.symbol, t.contract)" height="25")
                span.ml-3 {{ t.symbol + '@' + t.contract }}

          el-tab-pane(label="Manually")
            el-form-item(label="Token contract" prop="buy.contract")
              el-input(placeholder="eosio.token betdicetoken ridlridlcoin eosiomeetone etc.." v-model="form.buy.contract")

            el-form-item(v-if="form.buy.contract" label="Token symbol" prop="buy.symbol")
              // TODO Uppercase
              el-input(placeholder="DICE TRYBE CAT EOS etc.." v-model="form.buy.symbol").upperinput

        el-form-item(v-if="form.buy.symbol" label="Token amount")
          //el-input-number(v-model="form.sell.amount" :max="form.sell.maxAmount" :precision="form.sell.precision" :step="1").mt-2.w-100
          el-input-number(v-model="form.buy.amount" :precision="form.buy.precision" :step="1").mt-2.w-100
          .lead.mt-2 Price: {{ price }}

        span.dialog-footer
          el-button(type='primary' v-if="form.buy.amount > 0" @click="submit").w-100 Create order
</template>

<script>
import axios from 'axios'
import { mapGetters } from 'vuex'
import { captureException } from '@sentry/browser'

import TokenImage from '~/components/elements/TokenImage'
import { calculatePrice } from '~/utils'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      visible: false,

      userNfts: {},

      sell: [],

      tokenSelect: ''
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc']),
  },

  created() {
  },

  methods: {
    async fetchUserNfts() {
      const { rows } = await this.rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.user.name,
        table: 'sassets',
        limit: 1000
      })

      rows.map(nft => this.userNfts[nft.id] = nft)
    },

    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return
      this.visible = true
      this.fetchUserNfts()
    },

    async submit() {
      const form = { ...this.form } // Copy the reactive object

      form.sell.quantity = `${form.sell.amount.toFixed(form.sell.precision)} ${form.sell.symbol}`
      form.buy.quantity = `${form.buy.amount.toFixed(form.buy.precision)} ${form.buy.symbol}@${form.buy.contract}`

      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        const r = await this.$store.dispatch('chain/transfer', {
          to: this.$store.state.network.otc.contract,
          contract: form.sell.contract,
          actor: this.user.name,
          quantity: form.sell.quantity,
          memo: `place|${form.buy.quantity}`
        })

        this.$notify({ title: 'Order placed', message: 'Order placed successfully', type: 'success' })
        //this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
        this.visible = false
        this.$store.dispatch('otc/fetchOrders')
      } catch (e) {
        captureException(e, { extra: { form } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
</script>

<style scoped>
.el-form {
  /*padding: 10px 70px; */
}
</style>
