<template lang="pug">
AlcorContainer.analytics-chart
  .header.d-flex
    .d-flex
      .mode-items(v-if="modes")
        .mode(v-for="item in modes" :class="{active: selectedMode === item.value}" @click="$emit('update:selectedMode', item.value)") {{ item.value }}
    .d-flex
      AlcorButton(compact flat @click="$emit('revertChart')").mr-1
        .el-icon-refresh
        | Revert Chart
      .mode-items
        .mode(v-for="item in resolutions" :class="{active: selectedResolution === item.value}" @click="$emit('update:selectedResolution', item.value)") {{ item.title }}
  .chart-container
    client-only
      slot
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import AlcorRadio from '@/components/AlcorRadio'
import AlcorButton from '~/components/AlcorButton'

export default {
  name: 'AnalyticsChart',
  components: {
    AlcorContainer,
    AlcorRadio,
    AlcorButton
  },
  props: ['modes', 'selectedMode', 'selectedResolution'],
  data() {
    return {
      resolutions: [
        { title: '7D', value: '7D' },
        { title: '1M', value: '30D' },
        { title: 'All', value: 'All' },
      ],
    }
  },
  computed: {},

  watch: {
    // selectedResolution() {
    //   this.getChart()
    // },
  },

  mounted() {
    // this.getChart()
  },
  methods: {},
}
</script>

<style scoped lang="scss">
.analytics-chart {
  display: flex;
  flex-direction: column;
  // min-height: 100%;
  height: 100%;
}
.chart-container {
  flex: 1;
}
// .chart::v-deep {
//   .apexcharts-tooltip {
//     color: black !important;
//   }
// }
.header {
  justify-content: space-between;
}
.mode-items {
  display: flex;
  flex-wrap: wrap;
  padding: 2px;
  border-radius: var(--radius);
  background: var(--background-color-base);
}
.mode {
  padding: 2px 6px;
  border-radius: var(--radius);
  color: var(--text-disable);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
  &:hover {
    color: var(--text-default);
  }
  &.active {
    color: var(--text-default);
    background: var(--background-color-third);
  }
}
</style>
