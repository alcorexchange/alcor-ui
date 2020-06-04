<template lang="pug">
// FIXME
.row.mt-3
  .col-lg-3
    .row
      .col
        el-input(placeholder="Search pool" size="small" v-model="search" clearable)
      .col-lg-5(v-if="user && user.name == 'avral.pro'")
        create
    hr
    .row
      .col
        .mb-2(v-for="pool in filteredPools")
          el-button(plain size="small"
                    @click="setPool(pool)"
                    :class="{ 'is-active': current_sym == pool.supply.symbol.code().to_string() }").w-100
            .d-flex.justify-content-around
              div
                TokenImage(:src="$tokenLogo(pool.pool1.quantity.symbol.code().to_string(), pool.pool1.contract)" height="25")
                span.ml-2 {{ pool.pool1.quantity.symbol.code().to_string() }}
              div
                TokenImage(:src="$tokenLogo(pool.pool2.quantity.symbol.code().to_string(), pool.pool2.contract)" height="25")
                span.ml-2 {{ pool.pool2.quantity.symbol.code().to_string() }}

    //el-menu.el-menu-vertical-demo(default-active='2', @open='handleOpen', @close='handleClose', :collapse='isCollapse')
      el-menu-item(index='1-1') item one
        h1 olol
        span asdfasdf
  .col-lg-9
    el-card
      Swap

    //el-tabs(type='border-card')
      el-tab-pane(label='Swap')
        Swap

      el-tab-pane(label='Open pool')
        Create

      //el-tab-pane(label='Liquidity Provider')
        Liquidity
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
    //Liquidity
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

  watch: {
    pools(newVal, oldVal) {
      if (newVal.length > 0 && oldVal.length == 0) {
        this.setPool(newVal[0])
      }
    }
  },

  mounted() {
    this.$store.dispatch('pools/fetchPools')
  },

  methods: {
    setPool(pool) {
      const symbol = asset(pool.supply).symbol.code().to_string()
      this.$store.commit('pools/setCurrentSym', symbol)
    }
  }
}
</script>
