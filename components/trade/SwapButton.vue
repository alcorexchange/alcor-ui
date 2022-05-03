<template lang="pug">
  el-button.swap-button(type='button' @click='goToPool')
    slot
</template>

<script>
export default {
  props: ['pool'],

  methods: {
    goToPool() {
      this.$store.dispatch('swap/setPair', this.pool)
      this.$store.dispatch('swap/updatePair', this.pool)
      this.$store.commit('swap/setTab', 'Swap')
      this.$router.push('/swap')
    }
  }
}
</script>
