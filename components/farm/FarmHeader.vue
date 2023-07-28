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
    .right New
</template>

<script>
import AlcorSwitch from '@/components/AlcorSwitch'
export default {
  name: 'FarmHeader',
  components: {
    AlcorSwitch,
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
  font-size: 1rem;
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
</style>
