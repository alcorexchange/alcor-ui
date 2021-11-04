<template lang="pug">
  .tabs
    .tab(
      v-for="tab in tabs"
      :style="getStyle(tab)"
<<<<<<< HEAD
=======
      :class="getClass(tab)"
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
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
<<<<<<< HEAD
=======
    },
    getClass(tab) {
      let classBtn = 'greenHov'
      if (tab.label == 'sell') classBtn = 'redHov'
      return classBtn
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
    }
  }
}
</script>

<style lang="scss" scoped>
  .tabs {
<<<<<<< HEAD
    display: flex;
    .tab {
      padding: 10px 15px;
      text-align: center;
      width: 100%;
      text-transform: uppercase;
      font-weight: bolder;
=======
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
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
    }
  }
</style>
