<template lang="pug">
  ElTable(:data="items").analytics-holders-list
    ElTableColumn(label="#" v-slot="scope" width="60")
      span {{ scope.$index + 1 }}
    ElTableColumn(label="Account" v-slot="scope")
      .account {{ scope.row[0] }}
    ElTableColumn(label="Amount" v-slot="scope") {{ scope.row[1] | commaFloat }}
</template>

<script>
export default {
  name: 'AnalyticsHoldersList',
  props: ['items'],
}
</script>

<style scoped lang="scss">
.analytics-holders-list {
  border-radius: var(--radius-2);
}
</style>
