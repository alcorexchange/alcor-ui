<template lang="pug">
.bridge-history-item
  .main.fs-14
    .date.fs-12.mb-2 13:48 Jul 19, 2023
    .sides
      BridgeHistoryItemSide(label="From")
      .arrow
        i.el-icon-right
      BridgeHistoryItemSide(label="To" :off="status === 'incomplete'")
  .status-container
    .status(:style="{ color: renderStatus.color }")
      i(:class="renderStatus.icon")
      span.status-text.fs-14 {{ renderStatus.text }}
    .request(v-if="status === 'incomplete'")
      AlcorButton Submit Request
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import BridgeHistoryItemSide from './BridgeHistoryItemSide.vue'
export default {
  components: {
    BridgeHistoryItemSide,
    AlcorButton,
  },
  props: ['status'],
  computed: {
    renderStatus() {
      if (this.status === 'completed') {
        return {
          color: 'var(--main-green)',
          text: 'Completed',
          icon: 'el-icon-check',
        }
      }
      if (this.status === 'incomplete') {
        return {
          color: 'var(--main-red)',
          text: 'Not Completed',
          icon: 'el-icon-warning-outline',
        }
      }
      return {}
    },
  },
}
</script>

<style scoped lang="scss">
.bridge-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: var(--background-color-base);
  border-radius: 6px;
  padding: 12px;
}

.main {
  display: flex;
  flex-direction: column;
}

.date {
  color: var(--text-grey-thirdly);
}

.sides {
  display: flex;
  align-items: center;
  gap: 14px;
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.request {
  .alcor-button {
    color: var(--main-green);
  }
}
</style>
