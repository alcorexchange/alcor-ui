<template lang="pug">
.bridge-history
  .overflower
    BridgeHistoryItem(v-for="item in items" v-bind="item")
  .overflow-cover
</template>

<script>
import BridgeHistoryItem from '~/components/bridge/BridgeHistoryItem.vue'
export default {
  components: {
    BridgeHistoryItem,
  },
  computed: {
    items() {
      return Array.from({ length: 10 }, (_, index) => {
        return {
          status: index % 2 ? 'completed' : 'incomplete',
        }
      })
    },
  },
}
</script>

<style scoped lang="scss">
.bridge-history {
  --cover-height: 100px;
  position: relative;
}
.overflower {
  flex-direction: column;
  display: flex;
  gap: 4px;
  max-height: 480px;
  overflow-y: auto;
  padding-bottom: var(--cover-height);
}
.overflow-cover {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: var(--cover-height);
  pointer-events: none;
  background: linear-gradient(
    to top,
    var(--background-color-third),
    transparent
  );
  z-index: 2;
}
</style>
