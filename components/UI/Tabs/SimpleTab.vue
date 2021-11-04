<template lang="pug">
  .tabs
    .tab(
      v-for="tab in tabs"
      :class="tab == selected ? 'active' : ''"
      @click="selected = tab"
    ) {{ tab }}
</template>

<script>
export default {
  props: {
    tabs: Array
  },

  data() {
    return {
      selected: 'limit'
    }
  },

  watch: {
    selected(val) {
      this.$emit('tabSelect', val)
    }
  },
}
</script>

<style lang="scss" scoped>
  .tabs {
    display: flex;
<<<<<<< HEAD
    .tab {
      padding: 5px 15px;
      transition: .3s;
      &.active {
        color: black;
        background-color: #c1c1c185;
        border-radius: 5px;
=======
    gap: 5px;
    .tab {
      padding: 5px 15px;
      transition: .3s;
      cursor: pointer;
      border-radius: 5px;
      &:hover {
        background-color: #d9ddde69;
      }
      &.active {
        color: black;
        background-color: #c1c1c185;
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
      }
    }
  }
</style>
