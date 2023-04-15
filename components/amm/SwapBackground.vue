<template lang="pug">
  .swap-background(:style="`--swap-color: ${currentColor}`")
</template>

<script>
export default {
  name: 'SwapBackground',
  data: () => ({
    colors: [
      { name: 'eos', color: '#32D74B' },
      { name: 'wax', color: '#F89022' },
      { name: 'telos', color: '#60409F' },
      { name: 'proton', color: '#7543E3' },
      { name: 'bos', color: '#228BE9' },
    ]
  }),
  computed: {
    currentColor() {
      const item = this.colors.find(({ name }) => this.$store.state.network.name === name)
      return item ? item.color : this.colors[0].color
    }
  }
}
</script>

<style scoped lang="scss">
.swap-background {
  background: radial-gradient(circle at 50% 20%, var(--swap-color) 0%, transparent 40%);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.06;
}
</style>
