<template lang="pug">
.staking-faq
  ElCollapse(v-model="active" accordion)
    ElCollapseItem(v-for="item in items"  :name="item.name")
      template(#title)
        span.p-3 {{ item.title }}
      p.p-3 {{ item.description }}
</template>

<script>
export default {
  name: 'StakingFAQ',
  data: () => ({
    active: undefined,
  }),
  computed: {
    items() {
      return [
        { title: 'Question 1', description: 'Description 1', name: '1' },
        { title: 'Question 2', description: 'Description 2', name: '2' },
        { title: 'Question 3', description: 'Description 3', name: '3' },
        { title: 'Question 4', description: 'Description 4', name: '4' },
      ]
    },
  },
}
</script>

<style scoped lang="scss">
.staking-faq {
  &::v-deep {
    .el-collapse {
      border-radius: 8px;
      overflow: hidden;
    }
    .el-collapse-item__header {
    }
  }
}
</style>
