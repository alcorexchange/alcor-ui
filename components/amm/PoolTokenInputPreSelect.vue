<template lang="pug">
  .pre-selections
    AlcorButton.selection-button(v-for="item in values")
      span.fs-10.disable {{ item }} %
</template>

<script>
import AlcorButton from '~/components/AlcorButton.vue'
export default {
  name: 'PoolTokenInputPreSelect',
  components: {
    AlcorButton,
  },

  data: () => ({
    values: [15, 25, 50, 75, 100],
  }),
}
</script>

<style scoped lang="scss">
.pre-selections {
  display: flex;
  gap: 2px;
  .selection-button {
    background: transparent;
    border: 1px solid var(--border-color);
    padding: 2px 4px;
  }
}
</style>
