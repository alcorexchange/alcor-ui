<template lang="pug">
.bridge-history
  .overflower
    template(v-for="item in items")
      BridgeHistoryItem(:item="item" :key="item.id")
  .overflow-cover
</template>

<script>
import BridgeHistoryItem from '~/components/bridge/BridgeHistoryItem.vue'
export default {
  components: {
    BridgeHistoryItem
  },
  data() {
    return {
      items: [],
    }
  },
  async mounted() {
    const historyApiUrl = 'http://116.202.36.122:8082'
    const accountName = 'alcordexfund' // this.$store.state.user?.name;
    this.items = await fetch(`${historyApiUrl}/dev/ibc/${accountName}`).then(it => it.json())
  }
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
  background: linear-gradient(to top, var(--background-color-third), transparent);
  z-index: 2;
}
</style>
