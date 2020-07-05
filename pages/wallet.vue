<template lang="pug">
.row
  .col
    PleaseLoginButton
      el-card
        el-table(:data="balances", style='width: 100%' v-if="user")
          el-table-column(label='Asset' width="300")
            template(slot-scope="scope")
              TokenImage(:src="$tokenLogo(scope.row.currency, scope.row.contract)" height="25")
              span.ml-2 {{ scope.row.currency }}
              a(:href="monitorAccount(scope.row.contract)" target="_blank") ({{ scope.row.contract }})

          el-table-column(prop='amount', label='Amount' align="right" width="150" :sort-method="sortByAmount"
          sortable :sort-orders="['descending', null]")

          el-table-column(align='right')
            template(slot='header', slot-scope='scope')
              el-input(v-model='search', size='small', placeholder='Type to search').w-25
            template(slot-scope='scope')
              BOSIbc(
                v-if="scope.row.contract == 'bosibc.io' || scope.row.contract == network.baseToken.contract"
                :token="{contract: scope.row.contract, symbol: scope.row.currency, precision: Number(scope.row.decimals)}"
              )

              Withdraw(
                v-if="Object.keys(network.withdraw).includes(scope.row.id)",
                :token="{contract: scope.row.contract, symbol: scope.row.currency, precision: Number(scope.row.decimals)}"
              )

</template>

<script>
import { mapGetters, mapState } from 'vuex'

import BOSIbc from '~/components/withdraw/BOSIbc'
import Withdraw from '~/components/withdraw/Withdraw'

import TokenImage from '~/components/elements/TokenImage'
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

export default {
  components: {
    TokenImage,
    PleaseLoginButton,
    BOSIbc,
    Withdraw
  },

  data() {
    return {
      search: ''
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc']),
    ...mapState(['network']),

    balances() {
      if (!this.user.balances) return []

      return this.user.balances.filter(b => {
        if (parseFloat(b.amount) == 0) return false

        return b.id.toLowerCase().includes(this.search.toLowerCase())
      }).sort((a, b) => a.contract == this.network.baseToken.contract ? -1 : 1)
    },
  },

  methods: {
    sortByAmount(a, b) {
      return parseFloat(a.amount) > parseFloat(b.amount) ? 1 : -1
    }
  }
}

</script>
