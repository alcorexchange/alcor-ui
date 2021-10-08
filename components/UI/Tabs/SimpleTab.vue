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
    .tab {
      padding: 5px 15px;
      color: #f5f5f5;
      &.active {
        color: #9e9e9e;
      }
    }
  }
</style>
