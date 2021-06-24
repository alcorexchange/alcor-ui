<template lang="pug">
  .lp-new
    .main-card.alcor-card
        .card-title Add Liquidity
        .section-header
            .title Select pair
            .actions
                el-button(type="text") Clear All
        .pair-select-container
            PairSelectItem.first-pair
            PairSelectItem.second-pair
        Spacer(low)
        .section-header
            .title Select Pool
        .desc Select a pool type based on your preferred liquidity provider fee.
        .pool-select-container
            PoolSelectItem(v-model="selectedPool" value="0.05%" title="0.05% fee"  description="Test 0.05%")
            PoolSelectItem(v-model="selectedPool" value="0.1%" title="0.1% fee"  description="Test 0.1%")
            PoolSelectItem(v-model="selectedPool" value="1%" title="1% fee"  description="Test 1%")
</template>

<script>
import PairSelectItem from '@/components/lp_new/PairSelectItem.vue'
import PoolSelectItem from '@/components/lp_new/PoolSelectItem.vue'
import Spacer from '@/components/Spacer.vue'
export default {
  name: 'LPNew',
  components: {
    PairSelectItem,
    PoolSelectItem,
    Spacer
  },
  data: () => ({
    selectedPool: '0.05%'
  })
}
</script>

<style scoped lang="scss">
.main-card {
  width: 100%;
  max-width: 480px;
  margin: auto;
  border-radius: var(--radius-2);
  padding: 14px;
  background: var(--bg-big-card);
}
.card-title {
  text-align: center;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.desc {
  opacity: 0.6;
  font-size: 0.9rem;
}
.pair-select-container {
  display: flex;
  align-items: center;
  > * {
    flex: 1;
  }
  .first-pair {
    margin-right: 4px;
  }
  .second-pair {
    margin-left: 4px;
  }
}
.pool-select-container {
  display: flex;
  > * {
    flex: 1;
    margin: 2px;
  }
}
</style>
