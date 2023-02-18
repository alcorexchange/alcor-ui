<template lang="pug">
h1 adfasdfasdfasdf
//.empty-div
</template>

<script>
// This manages pool tokens selected and fee
import { Name, SymbolCode } from 'eos-common'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'AddLiquidityParams',

  // Force trailing slash
  fetch({ route, redirect }) {
    if (route.path[route.path.length - 1] !== '/') redirect(route.path + '/')
  },

  beforeRouteLeave(to, from, next) {
    next()
  },

  beforeRouteUpdate(to, from, next) {
    next()
  },

  computed: {
    ...mapState('market', ['id', 'symbol', 'quote_token', 'base_token'])
  },

  methods: {
    ...mapActions('market', ['clearField'])
  }
}
</script>
