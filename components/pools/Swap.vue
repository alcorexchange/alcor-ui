<template lang="pug">
div
  .row
    .col
      .text.item(v-if="current.pool1")
        .row
          .col
            .p-2
              p Quick swap or make money on provide liquidity.
          .col
            .d-flex
              Withdraw(:current="current" @update="fetch").ml-auto

              Liquidity(:current="current" @update="fetch").ml-auto
        .row.mb-3.mt-2
          .col-6.bordered
            .row
              .col-lg-2
                TokenImage(:src="$tokenLogo(poolOne.quantity.symbol.code().to_string(), poolOne.contract)" height="50").ml-2
              .col-lg-10
                .lead {{ poolOne.quantity.symbol.code().to_string() }}@{{ poolOne.contract }}
                b Pool size: {{ poolOne.quantity }}

                el-button(@click="swapInput"  icon="el-icon-refresh").ml-3 Switch

            hr

            .text-center
              .lead Input

              p The amount that you give

            el-input(type="number" v-model="amount1" clearable @change="amountChange").mt-3
              span(slot="suffix").mr-1 {{ poolOne.quantity.symbol.code().to_string() }}

            //.lead {{ order.sell.quantity }}@
              a(:href="monitorAccount(order.sell.contract)" target="_blank") {{ order.sell.contract }}
          .col-6
            .row
              .col-lg-2
                TokenImage(:src="$tokenLogo(poolTwo.quantity.symbol.code().to_string(), poolTwo.contract)" height="50").ml-2
              .col-lg-10
                .lead {{ poolTwo.quantity.symbol.code().to_string() }}@{{ poolTwo.contract }}
                b Pool size: {{ poolTwo.quantity }}

            hr

            .text-center
              .lead Output
              p.mt-2 The amount that you will receive

              .lead {{ amount2 }}
            //el-input(type="number" v-model="amount2" clearable @change="amountChange" disabled).mt-3
              span(slot="suffix").mr-1 {{ poolTwo.quantity.symbol.code().to_string() }}
        .row.mb-3(v-if="current.pool1")
          .col
            .row
              .col
                .lead Pool price: {{ (current.pool2.quantity.amount / current.pool1.quantity.amount).toFixed(5) }}
                  |  {{ current.pool1.quantity.symbol.code().to_string() }}
            .row
              .col
                .lead Current price: {{ price }}
        .row
          .col
            PleaseLoginButton
              el-button(type="primary" @click="swap" :loading="loading").w-100 Swap

      .text.item(v-else)
        .row.mb-3
          .col-6.bordered
            .p-3
              .lead No pools yet

  .row
    .col
      el-table(:data="pools" @row-click="clickPool" row-class-name="order-row")
        el-table-column(label="Backed token supply")
          template(slot-scope="scope")
            span {{ scope.row.supply.to_string() }}

        el-table-column(label="Pool 1")
          template(slot-scope="scope")
            TokenImage(:src="$tokenLogo(scope.row.pool1.quantity.symbol.code().to_string(), scope.row.pool1.contract)" height="25")
            span.ml-2(v-if="scope.row.pool1.quantity.symbol.code().to_string() == 'EOS' && scope.row.pool1.contract != 'eosio.token'")
              el-tooltip(effect="dark" content='This is not "EOS" system token, be careful' placement="top")
                el-tag(type="danger") {{ scope.row.pool1.quantity.symbol.code().to_string() }}@{{ scope.row.pool1.contract }}

            span.ml-2(v-else) {{ scope.row.pool1.quantity.symbol.code().to_string() }}@{{ scope.row.pool1.contract }}

        el-table-column(label="Pool 2")
          template(slot-scope="scope")
            TokenImage(:src="$tokenLogo(scope.row.pool2.quantity.symbol.code().to_string(), scope.row.pool2.contract)" height="25")
            span.ml-2(v-if="scope.row.pool2.quantity.symbol.code().to_string() == 'EOS' && scope.row.pool2.contract != 'eosio.token'")
              el-tooltip(effect="dark" content='This is not "EOS" system token, be careful' placement="top")
                el-tag(type="danger") {{ scope.row.pool2.quantity.symbol.code().to_string() }}@{{ scope.row.pool2.contract }}

            span.ml-2(v-else) {{ scope.row.pool2.quantity.symbol.code().to_string() }}@{{ scope.row.pool2.contract }}

        el-table-column(label="Liquidity provider fee")
          template(slot-scope="scope")
            span {{ scope.row.fee / 100 }} %
</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'
import Liquidity from '~/components/pools/Liquidity'
import Withdraw from '~/components/pools/Withdraw'

const inputToOutput = (a, pool1, pool2, fee) => {
  const tmp = a.multiply(-1).multiply(pool2).divide(pool1.plus(a))

  //Add fee
  return tmp.plus(tmp.multiply(-1).multiply(fee).plus(9999).divide(10000))
}

export default {
  components: {
    TokenImage,
    PleaseLoginButton,
    Liquidity,
    Withdraw
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      current: {},
      pools: [],
      input: 'pool1',

      loading: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc']),
    ...mapState(['network']),

    baseToken() {
      return this.$store.state.network.baseToken
    },

    poolOne() {
      return this.current[this.input]
    },

    poolTwo() {
      return this.current[this.input == 'pool1' ? 'pool2' : 'pool1']
    },

    price() {
      if (this.input == 'pool1') {
        return Math.abs(this.amount2 / this.amount1).toFixed(5)
      } else {
        return Math.abs(this.amount1 / this.amount2).toFixed(5)
      }
    }
  },

  watch: {
    amount1() {
      if (isNaN(this.amount1)) return

      let a = asset(`${this.amount1} ${this.poolOne.quantity.symbol.code().to_string()}`).amount

      const p1 = this.poolOne.quantity.amount
      const p2 = this.poolTwo.quantity.amount

      //this.calcReceive(this.amount1)
      if (this.input == 'pool1') {
        const r = number_to_asset(0, this.poolTwo.quantity.symbol)
        r.set_amount(Math.abs(inputToOutput(a, p1, p2, this.current.fee)))
        this.amount2 = r.to_string().split(' ')[0]
      } else {
        // FIXME Не считает для пресижина

        const fee = a.multiply(this.current.fee).plus(9999).divide(10000)
        a = a.minus(fee)
        const div = p1.plus(a)
        const result = a.multiply(p2).multiply(-1).divide(div).abs()
        const r = number_to_asset(0, this.current.pool1.quantity.symbol)
        r.set_amount(result)
        //console.log('result', r.amount, 'will receive: ', check)
        this.amount2 = r.to_string().split(' ')[0]
      }
    },

    amount2() {
      //this.calcReceive(this.amount2)
    }

  },

  mounted() {
    this.fetch()
  },

  methods: {
    async fetch() {
      const { rows } = await this.rpc.get_table_by_scope({
        code: this.network.pools.contract,
        table: 'stat',
        limit: 1000
      })

      this.pools = []

      rows.reverse().map(async r => {
        const { rows: [pool] } = await this.rpc.get_table_rows({
          code: this.network.pools.contract,
          scope: r.scope,
          table: 'stat',
          limit: 1
        })

        if (!this.current.pool1) this.current = pool

        pool.pool1.quantity = asset(pool.pool1.quantity)
        pool.pool2.quantity = asset(pool.pool2.quantity)
        pool.supply = asset(pool.supply)

        this.pools.push(pool)
      })
      console.log('fetch, new pools: ', this.pools)
    },

    amountChange() {
      this.amount1 = this.toFixed(this.amount1, this.poolOne.quantity.symbol.precision())
      this.amount2 = this.toFixed(this.amount2, this.poolTwo.quantity.symbol.precision())
    },

    clickPool(pool) {
      this.current = pool
    },

    async swap() {
      const authorization = [{ actor: this.user.name, permission: 'active' }]

      let amount1
      let amount2

      const input = number_to_asset(parseFloat(this.amount1), this.poolOne.quantity.symbol).to_string()

      //if (this.input == 'pool1') {
      //  amount1 = number_to_asset(parseFloat(this.amount1), this.poolOne.quantity.symbol).to_string()
      //  amount2 = number_to_asset(-parseFloat(this.amount2), this.poolTwo.quantity.symbol).to_string()
      //} else {
      //  amount1 = number_to_asset(-parseFloat(this.amount2), this.poolTwo.quantity.symbol).to_string()
      //  amount2 = number_to_asset(parseFloat(this.amount1), this.poolOne.quantity.symbol).to_string()
      //}

      if (this.input == 'pool1') {
        amount1 = number_to_asset(parseFloat(this.amount1), this.poolOne.quantity.symbol).to_string()
        amount2 = '-' + number_to_asset(parseFloat(this.amount2), this.poolTwo.quantity.symbol).to_string()
      } else {
        amount1 = '-' + number_to_asset(parseFloat(this.amount2), this.poolTwo.quantity.symbol).to_string()
        amount2 = number_to_asset(parseFloat(this.amount1), this.poolOne.quantity.symbol).to_string()
      }

      //console.log(amount1, this.amount2)
      //return

      const actions = [
        {
          account: this.network.pools.contract,
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: this.current.pool1.quantity.symbol.toString() }
          }
        }, {
          account: this.network.pools.contract,
          name: 'openext',
          authorization,
          data: {
            user: this.user.name,
            payer: this.user.name,
            ext_symbol: { contract: this.current.pool2.contract, sym: this.current.pool2.quantity.symbol.toString() }
          }
        }, {
          account: this.poolOne.contract,
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: this.network.pools.contract,
            quantity: input,
            memo: ''
          }
        },
        {
          account: this.network.pools.contract,
          name: 'exchange',
          authorization,
          data: {
            user: this.user.name,
            through: this.current.supply.symbol.toString(),
            ext_asset1: {
              contract: this.current.pool1.contract,
              quantity: amount1
            },
            ext_asset2: {
              contract: this.current.pool2.contract,
              quantity: amount2
            }
          }
        }, {
          account: this.network.pools.contract,
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.current.pool1.contract, sym: `${this.current.pool1.quantity.symbol.toString()}` },
            to: this.user.name,
            memo: ''
          }
        }, {
          account: this.network.pools.contract,
          name: 'closeext',
          authorization,
          data: {
            user: this.user.name,
            ext_symbol: { contract: this.current.pool2.contract, sym: `${this.current.pool2.quantity.symbol.toString()}` },
            to: this.user.name,
            memo: ''
          }
        }
      ]

      this.loading = true
      try {
        const r = await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({ title: 'Exchange', message: 'Success', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'Place order', message: e, type: 'error' })
      } finally {
        this.fetch()
        this.loading = false
      }
    },

    swapInput() {
      this.input = this.input == 'pool1' ? 'pool2' : 'pool1'

      this.amountChange()
    },
  }
}
</script>

<style>
.bordered {
  border-right: 1px solid;
}
</style>
