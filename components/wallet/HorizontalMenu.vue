<template lang="pug">
.row.mb-4
  .tab-btn.border-bottom--green(
    v-for='(tab, index) in tabs',
    :key='index',
    v-if='currentTab === tab.slug'
  ) {{ tab.title }}
  .tab-btn.border-bottom--gray(v-else='', @click='handleTab(tab.slug)') {{ tab.title }}
</template>

<script>
export default {
  props: ['tabs', 'currentTab', 'handleTab'],
  created() {
    console.log(this.tabs)
  },
}
</script>

<style lang="scss" scoped>
.tab-btn {
  cursor: pointer;
  padding: 12px 0;
  font-size: 15px;
  text-align: center;
  width: 50%;
  color: #bec6cb;
}
.border-bottom--gray {
  border-bottom: 1px solid #333;
}
.border-bottom--green {
  border-bottom: 1px solid #749e5e;
}
</style>
