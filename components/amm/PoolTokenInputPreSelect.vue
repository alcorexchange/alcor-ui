<template lang="pug">
.pre-selections
  AlcorButton.selection-button(v-for="item in values" @click="handleSelect(item)")
    span.fs-10.disable {{ item }} %
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
export default {
  name: 'PoolTokenInputPreSelect',
  components: {
    AlcorButton,
  },

  props: ['max'],

  data: () => ({
    values: [15, 25, 50, 75],
  }),

  methods: {
    handleSelect(percentage) {
      if (!this.max) return

      const value = (this.max * percentage) / 100

      this.$emit('setValue', `${value}`)
    },
  },
}
</script>

<style scoped lang="scss">
.pre-selections {
  display: flex;
  gap: 2px;
  .selection-button {
    background: transparent;
    border: 1px solid var(--border-color);
    padding: 1px 4px;
  }
}
</style>
