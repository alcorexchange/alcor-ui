<template lang="pug">
div.pools
  .table-header
    el-input(prefix-icon="el-icon-search" :placeholder="$t('Search name or paste address')")
  .table.el-card.is-always-shadow
    PositionsList(@positionClick="$router.push(localeRoute($event.link))")
</template>

<script>
import PositionsList from '~/components/amm/Position/PositionsList'

export default {
  name: 'WalletLiquidityPools',
  components: {
    PositionsList
  },
  data: () => ({
    search: ''
  }),
}
</script>

<style scoped lang="scss">
.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  .el-input {
    max-width: 300px;
    margin-right: 8px;
  }

  .el-input__inner {
    background: transparent !important;
  }
}

.el-card {
  border: none;
}

.asset-container {
  display: flex;
  align-items: center;

  .asset {
    display: flex;
    flex-direction: column;
    margin-left: 10px;
  }

  .asset-name {
    font-weight: bold;
  }
}

.detailed-item-container {
  display: flex;
  flex-direction: column;
}

.actions {
  display: flex;

  .add {
    background: var(--main-green);
    margin-right: 8px;

    &:hover {
      opacity: 0.8;
    }
  }

  .remove {
    background: var(--main-red);

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>
