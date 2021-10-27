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
    gap: 5px;
    .tab {
      padding: 5px 15px;
      transition: .3s;
      cursor: pointer;
      color: black;
      border-radius: 5px;
      &:hover {
        background-color: #d9ddde69;
      }
      &.active {
        background-color: #c1c1c185;
      }
    }
  }
</style>
