<template lang="pug">
  el-button.swap-button(type='button' @click='goToPool')
    slot
</template>

<script>
export default {
  props: ['pool'],

  methods: {
    goToPool() {
      const pair = this.$store.state.swap.pairs.filter(p => p.id == this.pool)[0]

      if (!pair) return

      const input = `${pair.pool1.quantity.symbol.code().to_string()}-${pair.pool1.contract}`
      const output = `${pair.pool2.quantity.symbol.code().to_string()}-${pair.pool2.contract}`

      const q = new URLSearchParams({ input, output })
      this.openInNewTab('/swap?' + q)
    }
  }
}
</script>
