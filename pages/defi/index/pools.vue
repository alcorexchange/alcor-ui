<template lang="pug">
.row.mt-3
  .col-md-3.pr-1
    .row
      .col
        el-input(placeholder="Search pool" size="small" v-model="search" clearable).mb-2
      .col-lg-5
        create.mb-2
    .row
      .col
        .pools-list.pr-1
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
        .text-center(v-if="filteredPools.length > 11")
          i.el-icon-caret-bottom
  .col-md-9
    el-card
      nuxt-child
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import Create from '~/components/pools/Create'

export default {
  components: {
    Create,
    TokenImage
  },

  data() {
    return {
      search: ''
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters('pools', ['pools']),
    ...mapState('pools', ['current_sym']),

    filteredPools() {
      return this.pools.filter(p => {
        const s = (p.pool2.quantity.symbol.code().to_string() + p.pool2.contract).toLowerCase()
        return s.includes(this.search.toLowerCase()) &&
          !this.network.SCAM_CONTRACTS.some(r => [p.pool1.contract, p.pool2.contract].includes(r))
      })
    }
  },

  async mounted() {
    const store = this.$store

    if (store.state.pools.pools.length == 0) {
      await store.dispatch('pools/fetchPools')
    }
  },

  methods: {
    setPool(p) {
      const sym1 = `${p.pool1.contract}-${p.pool1.quantity.symbol.code().to_string().toLowerCase()}`
      const sym2 = `${p.pool2.contract}-${p.pool2.quantity.symbol.code().to_string().toLowerCase()}`

      this.$router.push({
        name: 'defi-index-pools-pool',
        params: {
          pool: `${sym1}_${sym2}`
        }
      })
    }
  }
}
</script>

<style scoped>
.pools-list {
  max-height: calc(100vh - 200px);
  overflow: auto;
}
</style>
