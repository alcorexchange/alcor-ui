<template lang="pug">
AlcorButton.max-bage.h-fit(noColor, @click="onMax" :class="{disabled: !token}") MAX
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'MaxBage',
  props: ['token'],
  components: {
    AlcorButton,
  },
  methods: {
    onMax() {
      const { token: { symbol, contract } } = this
      const balance = this.$tokenBalance(symbol, contract)
      this.$emit('max', balance)
    },
  },
}
</script>

<style scoped lang="scss">
.max-bage {
  font-size: 0.86rem;
  background: transparent;
  padding: 4px 6px;
  &.disabled{
    pointer-events: none;
    color: var(--text-disable);

  }
}
</style>