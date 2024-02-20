<template lang="pug">
.token-option(@click="changeToken") {{ token }}
</template>

<script>
export default {
  props: ['token'],
  methods: {
    changeToken() {
      this.$emit('click', this.token)
    }
  }
}
</script>

<style lang="scss">
.token-option {
  width: 350px;
}
</style>
