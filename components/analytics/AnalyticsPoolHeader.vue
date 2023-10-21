<template lang="pug">
.header-container
  .analytics-token-header.mb-4
    .name-and-image
      PairIcons.pair-icons(
        size="22"
        offset="20%"
        :token1="{contract: 'usdt.alcor', symbol: 'USDT'}"
        :token2="{contract: 'usdt.alcor', symbol: 'USDT'}"
      )
      .name.fs-32 USDT / USDT
    Tag 0.3%
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
import Tag from '~/components/elements/Tag.vue'
export default {
  name: 'AnalyticsTokenHeader',
  components: {
    AlcorButton,
    PairIcons,
    Tag,
  },
}
</script>

<style scoped lang="scss">
.analytics-token-header {
  display: flex;
  gap: 8px;
  align-items: center;
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .image {
    width: 32px;
  }
  .contract {
    color: var(--text-disable);
    margin: 0 4px;
  }
  .name,
  .price {
    line-height: 1.2;
  }
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  ::v-deep {
    .el-input__inner {
      width: 120px;
      padding-left: 8px;
      height: 32px;
      line-height: 32px;
    }
    .el-input__suffix {
      display: flex;
      align-items: center;
    }
  }
}
</style>
