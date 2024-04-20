<template lang="pug">
  el-button.swap-button(type='button' @click='goToPool')
    slot
</template>

<script>
export default {
  props: ['pool'],

  methods: {
    goToPool() {
      const isReverted = this.$store.state.market.base_token.id == this.pool.tokenA.id

      const input = isReverted ? this.pool.tokenA.id : this.pool.tokenB.id
      const output = isReverted ? this.pool.tokenB.id : this.pool.tokenA.id

      const q = new URLSearchParams({ input, output })
      this.openInNewTab(`${this.$i18n.locale === 'en' ? '' : '/' + this.$i18n.locale}/swap/?` + q)
    }
  }
}
</script>
