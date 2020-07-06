<template lang="pug">
.row.mt-3
  .col-md-3.pr-1
    .row
      .col
        el-input(placeholder="Search pool" size="small" v-model="search" clearable).mb-2
      .col-lg-5
        create
    hr
    .row
      .col
        .mb-2(v-for="pool in filteredPools")
          el-button(plain size="small"
                    @click="setPool(pool)"
                    :class="{ 'is-active': current_sym == pool.supply.symbol.code().to_string() }").w-100
            .row
              .col-6
                TokenImage(:src="$tokenLogo(pool.pool1.quantity.symbol.code().to_string(), pool.pool1.contract)" height="25")
                span.ml-2 {{ pool.pool1.quantity.symbol.code().to_string() }}
              .col-6.text-left
                TokenImage(:src="$tokenLogo(pool.pool2.quantity.symbol.code().to_string(), pool.pool2.contract)" height="25")
                span.ml-2 {{ pool.pool2.quantity.symbol.code().to_string() }}
  .col-md-9
    el-card
      Swap
</template>

<script>
import { mapState } from 'vuex'
import { asset } from 'eos-common'

import TokenImage from '~/components/elements/TokenImage'

import Swap from '~/components/pools/Swap'
import Create from '~/components/pools/Create'

export default {
  components: {
    Swap,
    Create,
    TokenImage
  },

  data() {
    return {
      search: ''
    }
  },

  computed: {
    ...mapState(['user']),
    ...mapState('pools', ['pools', 'current_sym']),

    filteredPools() {
      return this.pools.filter(p => p.supply.symbol.toString().toLowerCase().includes(this.search.toLowerCase()))
    }
  },

  mounted() {
    this.$store.dispatch('pools/fetchPools')
  },

  methods: {
    setPool(pool) {
      const symbol = pool.supply.symbol.code().to_string()
      this.$store.commit('pools/setCurrentSym', symbol)
    }
  },

  head() {
    return {
      title: `Alcor.exchange | Liquidity pools`,

      meta: [
        { hid: 'description', name: 'description', content: `Swap tokens or make income on liquidity providing` }
      ]
    }
  }
}
</script>
