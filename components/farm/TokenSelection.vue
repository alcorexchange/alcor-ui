<template lang="pug">
.token-selection
  .item
    .farm-create-section-title Select Base Token
    SelectToken(w100)
  .item
    .farm-create-section-title Select Quote Token
    SelectToken(w100)
</template>

<script>
import SelectToken from '@/components/modals/amm/SelectToken2.vue'
export default {
  name: 'TokenSelection',
  components: {
    SelectToken,
  },
}
</script>

<style scoped lang="scss">
.token-selection {
  display: flex;
  gap: 10px;
  .item {
    flex: 1;
  }
}
</style>
