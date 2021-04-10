<template lang="pug">
  .participate-chart
    .tab-bar
        .item(@click="setActiveTab('allocation')" :class="{active: activeTab === 'allocation'}")
            span Allocation
            span.line
        .item(@click="setActiveTab('release')" :class="{active: activeTab === 'release'}")
            span Release schedule
            span.line
    SSpacer
    .tab.alcor-card
        Graph
</template>

<script>
import Graph from '@/components/landing/Graph'
import SSpacer from '@/components/SSpacer'
export default {
  name: 'ParticipateChart',
  components: {
    Graph,
    SSpacer
  },
  data: () => ({
    activeTab: 'allocation'
  }),
  methods: {
    setActiveTab(tab) {
      this.activeTab = tab
    }
  }
}
</script>

<style scoped lang="scss">
.tab-bar {
  display: flex;
}
.item {
  padding: 4px 8px;
  color: var(--text-grey-thirdly);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  .line {
    background: var(--text-grey-thirdly);
    height: 2px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  &.active {
    color: var(--text-default);
    .line {
      opacity: 1;
    }
  }
}
.tab {
  background: var(--bg-alter-1);
}
</style>
