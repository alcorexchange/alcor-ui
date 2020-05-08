<template lang="pug">
div
  .row
    .col
      .text.item(v-if="current.pool1")
        .row.mb-3
          .col-6.bordered
            .row
              .col-lg-2
                TokenImage(:src="$tokenLogo(poolOne.quantity.symbol.code().to_string(), poolOne.contract)" height="50").ml-2
              .col-lg-10
                .lead {{ poolOne.quantity.symbol.code().to_string() }}@{{ poolOne.contract }}
                b Pool size: {{ poolOne.quantity }}

            hr

            .text-center
              .lead Input
                el-button(@click="swapInput"  icon="el-icon-refresh" type="text").ml-3 Switch

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
        .row.mb-3
          .col
            .lead Price: {{ price }}
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

        el-table-column(label="Pool fee")
          template(slot-scope="scope")
            span {{ scope.row.fee / 100 }} %
</template>

<script>
import { asset, number_to_asset } from 'eos-common'
import { mapGetters, mapState } from 'vuex'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import TokenImage from '~/components/elements/TokenImage'

const inputToOutput = (a, pool1, pool2, fee) => {
  const tmp = a.multiply(-1).multiply(pool2).divide(pool1.plus(a))

  //Add fee
  return tmp.plus(tmp.multiply(-1).multiply(fee).plus(9999).divide(10000))
}

export default {
  components: {
    TokenImage,
    PleaseLoginButton
  },

  data() {
    return {
      amount1: 0.0,
      amount2: 0.0,

      current: {},
      pools: [],
      input: 'pool1',

      loading: false,
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
      return Math.abs(this.amount1 / this.amount2).toFixed(5)
    }
  },

  watch: {
    amount1() {
      let a = asset(`${this.amount1} ${this.poolOne.quantity.symbol.code().to_string()}`).amount

      const p1 = this.poolOne.quantity.amount
      const p2 = this.poolTwo.quantity.amount

      //this.calcReceive(this.amount1)
      if (this.input == 'pool1') {
        const r = number_to_asset(0, this.poolTwo.quantity.symbol)
        r.set_amount(inputToOutput(a, p1, p2, this.current.fee))
        this.amount2 = r.to_string().split(' ')[0]
      } else {
        // FIXME Not working yet
        const fee = a.multiply(-1).multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000)

        a = a.minus(fee)

        const div = p1.plus(a)
        const result = a.multiply(p2).multiply(-1).divide(div)

        const r = number_to_asset(0, this.poolOne.quantity.symbol)
        r.set_amount(result)
        this.amount2 = r.to_string().split(' ')[0]
      }
    },

    amount2() {
      //this.calcReceive(this.amount2)
    }

  },

  async created() {
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
      console.log(this.current)

      pool.pool1.quantity = asset(pool.pool1.quantity)
      pool.pool2.quantity = asset(pool.pool2.quantity)
      pool.supply = asset(pool.supply)

      this.pools.push(pool)
    })
  },

  methods: {
    setInputToken(token) {
      this.input.token = token
    },

    amountChange() {
      this.amount1 = this.toFixed(this.amount1, this.poolOne.quantity.symbol.precision())
      this.amount2 = this.toFixed(this.amount2, this.poolTwo.quantity.symbol.precision())
    },

    clickPool(pool) {
      this.current = pool
    },

    swap() {
      this.$store.dispatch('chain/sendTransaction', [
        {
          account: 'lp',
          name: 'exchange',
          authorization: [{
            actor: this.user.name,
            permission: 'active'
          }],
          data: {
            user: this.user.name,
            through: this.current.supply.symbol.toString(),
            ext_asset1: {
              contract: this.current.pool1.contract,
              quantity: number_to_asset(parseFloat(this.amount1), this.current.pool1.quantity.symbol).to_string()
            },
            ext_asset2: {
              contract: this.current.pool2.contract,
              quantity: number_to_asset(parseFloat(this.amount2), this.current.pool2.quantity.symbol).to_string()
            }
          }
        }
      ])
    },

    swapInput() {
      this.input = this.input == 'pool1' ? 'pool2' : 'pool1'

      this.amountChange()
    },

    calcReceive(a) {
      a = asset(`${a} ${this.poolOne.quantity.symbol.code().to_string()}`).amount

      const p1 = this.poolOne.quantity.amount
      const p2 = this.poolTwo.quantity.amount


      if (this.input == 'pool1') {
        // Compute
        //const r = inputToOutput(a)
        const r = number_to_asset(0, this.poolTwo.quantity.symbol)
        r.set_amount(inputToOutput(a))
        this.amount2 = r.to_string().split(' ')[0]
      } else {
        // FIXME Добавить досчет для выгодной ситуации

        // Amount fee Тут через позитив расчитывает
        //const fee = a.multiply(this.current.fee).plus(9999).divide(10000)
        ////const fee = -a.multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000)
        //a = a.plus(fee)
        //const div = p1.minus(a)
        //const result = a.multiply(p2).plus(div).minus(1).divide(div)

        //console.log('zz', a.multiply(-1).multiply(this.current.fee).plus(9999).plus(10000).minus(1))
        a = a.multiply(-1)
        const fee = a.multiply(-1).multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000)

        a = a.minus(fee)

        const div = p1.plus(a)
        const result = a.multiply(p2).multiply(-1).divide(div)

        const r = number_to_asset(0, this.poolOne.quantity.symbol)
        r.set_amount(result)
        this.amount1 = r.to_string().split(' ')[0]

        // FIXME 1,2346 не прошел

        // Высчитываем:

        //const tmp = a.multiply(p2).plus(div).minus(1).divide(div).minus(fee)
        //console.log('pre_tmp', tmp)
        //console.log('tmp', tmp.minus(fee))

        //let tmp = a.multiply(p2).divide(a.plus(p1))
        ////const fee = tmp.multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000) // Rounding up
        //const fee = tmp.multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000) // Rounding up
        //tmp = tmp.minus(fee)

        //console.log(tmp, fee)

        //const b = tmp.minus(tmp.multiply(this.current.fee).plus(9999).plus(10000).minus(1).divide(10000))
        //const b = tmp.minus(tmp.multiply(this.current.fee).plus(9999).divide(10000))
        //console.log(b)
      }
    }
  }
}
</script>

<style>
.input-with-select .el-select .el-input {
  width: 300px;
}
.input-with-select .el-input-group__append {
  background-color: #fff;
}

.bordered {
  border-right: 1px solid;
}
</style>
