<template lang="pug">
  .farm-header
    .left
      el-input(class="farms-search-input" placeholder="Search Tokens")
      AlcorSwitch(
        class="alcor-switch"
        one="Active"
        two="Finished"
        active="two"
      )
      .stacked-only
        el-switch(
          active-text="Stacked only"
        )
    .right
      AlcorButton(class="new-farm")
        i.el-icon-circle-plus-outline
        span Open New Farm
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
import AlcorButton from '@/components/AlcorButton'
export default {
  name: 'FarmHeader',
  components: {
    AlcorSwitch,
    AlcorButton,
  },
}
</script>

<style scoped lang="scss">
.farm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.farms-search-input::v-deep {
  max-width: 240px;
  .el-input__inner {
    background: var(--select-color);
  }
}
.alcor-switch {
  font-size: 0.9rem;
  background: var(--btn-active);
  &::v-deep {
    .item {
      padding: 4px 10px;
    }
    .background {
      background: var(--select-color);
    }
  }
}

.new-farm {
  padding: 8px 16px !important;
}
</style>
