<template lang="pug">
  ElTable(:data="items" rowClassName="pointer" @row-click="handleRowClick").analytics-holders-list
    ElTableColumn(label="#" v-slot="scope" width="60")
      span {{ scope.$index + 1 }}
    ElTableColumn(label="Account" v-slot="scope")
      .account {{ scope.row[0] }}
    ElTableColumn(label="Amount" v-slot="scope") {{ scope.row[1] | commaFloat }}
    ElTableColumn(v-if="!isMobile" label="Share" v-slot="scope") {{ getPercentage(scope.row[1]) }}%
</template>

<script>
export default {
  name: 'AnalyticsHoldersList',
  props: ['items', 'total'],
  methods: {
    getPercentage(amount) {
      if (!this.total) return '0.00'

      const total = this.total.split(' ')[0]
      return ((amount * 100) / total).toFixed(2)
    },
    handleRowClick(row) {
      this.openInNewTab(this.monitorAccount(row[0]))
    },
  },
}
</script>

<style scoped lang="scss">
.analytics-holders-list {
  border-radius: var(--radius-2);
}
</style>
