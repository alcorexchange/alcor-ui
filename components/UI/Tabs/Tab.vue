<template lang="pug">
  .tabs
    .tab(
      v-for="tab in tabs"
      :style="getStyle(tab)"
      @click="selected = tab.label"
    ) {{ tab.label }}
</template>

<script>
export default {
  props: {
    selectByDefault: String,
    tabs: Array
  },

  data() {
    return {
      selected: 'buy'
    }
  },

  watch: {
    selected(val) {
      this.$emit('tabSelect', val)
    },
    selectByDefault(val) {
      this.selected = val
    }
  },

  methods: {
    getStyle(tab) {
      if (!tab.color) return

      let style = `border: 1px solid #${tab.color};`
      if (tab.label == this.selected) style = `background-color: #${tab.color};`

      return style
    }
  }
}
</script>

<style lang="scss" scoped>
  .tabs {
    display: flex;
    .tab {
      padding: 10px 15px;
      text-align: center;
      width: 100%;
      text-transform: uppercase;
      font-weight: bolder;
    }
  }
</style>
