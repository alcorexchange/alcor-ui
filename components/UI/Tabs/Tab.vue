<template lang="pug">
  .tabs
    .tab(
      v-for="tab in tabs"
      :style="getStyle(tab)"
      :class="getClass(tab)"
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
    },
    getClass(tab) {
      let classBtn = 'greenHov'
      if (tab.label == 'sell') classBtn = 'redHov'
      return classBtn
    }
  }
}
</script>

<style lang="scss" scoped>
  .tabs {
    display: grid;
    grid-gap: 5px;
    grid-template-columns: repeat(2, 1fr);
    .tab {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 35px;
      width: 100%;
      text-transform: uppercase;
      font-weight: bolder;
      cursor: pointer;
      &.greenHov:hover {
        background-color: #aed58173;
      }
      &.redHov:hover {
        background-color: #e5737352;
      }
    }
  }
</style>
