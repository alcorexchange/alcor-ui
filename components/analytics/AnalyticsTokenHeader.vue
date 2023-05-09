<template lang="pug">
.analytics-token-header
  .name-and-image
    img.image(:src="$tokenLogo('USDT', 'usdt.alcor')" )
    .name.fs-32 USDT
  .contract.fs-20 (usdt.alcor)
  .price.fs-24 $12,010
  .change.fs-14 +8.40%
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'AnalyticsTokenHeader',
  components: {
    AlcorButton
  },
}
</script>

<style scoped lang="scss">
.analytics-token-header {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .image {
    width: 32px;
  }
  .contract {
    color: var(--text-disable);
    margin: 0 4px;
  }
  .name, .price {
    line-height: 1.2;
  }
}
</style>
