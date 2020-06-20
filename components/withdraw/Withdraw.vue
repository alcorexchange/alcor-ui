<template lang="pug">
// TODO Refactor with walidators for form
// TODO boscore withdraws https://boscore.gitbook.io/docs/essentials/bos-essentials/ibc-inter-blockchain-communication/user-guide
div
  el-button(type="primary" icon="el-icon-wallet" size="mini" @click="open").ml-auto Withdraw

  el-dialog(title="Withdraw using Steem-Engine", :visible.sync="visible" width="25%" v-if="user")
    el-form(ref="form" label-position="left")
      .row
        .col-2
          TokenImage(:src="$tokenLogo(this.token.symbol.name, this.token.contract)" height="50")

        .col-10
          .row
            .col
              b Network: {{ peg.network.name }}
          .row
            .col
              b Symbol: {{ peg.network.symbol }}
          .row
            .col
              b Balance: {{ tokenBalance }}

      .row.mt-3
        .col
          .label {{ peg.desc }}


      el-form-item.mt-2
        template(slot="label")
          b Withdraw amount:
        el-input-number(v-model="amount" :precision="token.symbol.precision" :step="1").w-100

      el-form-item.mt-1
        template(slot="label")
          b {{ peg.network.name }} address:
          .text-info No walidation of address yet, be careful!
        el-input(v-model="account" placeholder="address..").w-100


    span.dialog-footer
      el-button(type='primary' @click="submit").w-100 Withdraw
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      visible: false,

      account: '',
      amount: 0.0
    }
  },

  computed: {
    ...mapState(['user', 'network']),
    ...mapState('market', ['token']),
    ...mapGetters(['tokenBalance']),

    peg() {
      return this.network.withdraw[this.token.str]
    }
  },

  methods: {
    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return
      this.visible = true
    },

    async submit() {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for wallet'
      })

      const quantity = this.amount.toFixed(this.token.symbol.precision) + ' ' + this.token.symbol.name

      try {
        const r = await this.$store.dispatch('chain/transfer', {
          to: this.peg.gateway,
          contract: this.token.contract,
          actor: this.user.name,
          quantity,
          memo: this.peg.withdrawMemo.replace('{account}', this.account)
        })

        this.visible = false

        this.$alert(`<a href="${this.network.monitor}/tx/${r.transaction_id}" target="_blank">Transaction id</a>`, 'Transaction complete!', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: 'OK',
          callback: (action) => {
            this.$notify({ title: 'Withdraw in process', type: 'success' })
          }
        })

        //this.$notify({ title: 'Place order', message: r.processed.action_traces[0].inline_traces[1].console, type: 'success' })
      } catch (e) {
        captureException(e)
        this.$notify({ title: 'Withdraw error', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        loading.close()
      }
    }
  }
}
</script>

<style scoped>
.upperinput {
    text-transform: uppercase;
}
.upperinput:placeholder-shown {
    text-transform: none;
}
</style>
