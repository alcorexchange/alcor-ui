<template lang="pug">
.sorter
  i(
    class="el-icon-caret-top"
    :class="{ 'active': activeSort.key === sortBy && activeSort.route === 1 }"
    @click="() => sort(sortBy, 1)"
  )
  i(
    class="el-icon-caret-bottom"
    :class="{ 'active': activeSort.key === sortBy && activeSort.route === 0 }"
    @click="() => sort(sortBy, 0)"
  )
</template>

<script>
export default {
  props: ['sortBy', 'activeSort'],

  methods: {
    sort(key, route) {
      this.$emit('change', { key, route })
    }
  }
}
</script>

<style scoped>
.sorter {
  display: flex;
  flex-direction: column;
}

i {
  font-size: 12px;
  line-height: 8px !important;
  cursor: pointer;
  color: #444444;
}

i.active {
  color: var(--text-grey-thirdly);
}
</style>
