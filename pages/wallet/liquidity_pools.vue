<template lang="pug">
div.pools
  .table-header
    el-input(v-model="search" prefix-icon="el-icon-search" :placeholder="$t('Search Token')")
    .end.d-flex.gap-10
      ClaimAllButton
      AlcorButton(to="/positions/new" access tag="nuxt-link")
        i.el-icon-plus
        .fs-14 {{ $t('New Position') }}
  .table.el-card.is-always-shadow
    //- PositionsList(@positionClick="$router.push(localeRoute($event.link))" :search="search")
    VirtualPositionsList(@positionClick="$router.push(localeRoute($event.link))" :search="search")
</template>

<script>
import PositionsList from '~/components/amm/Position/PositionsList'
import VirtualPositionsList from '~/components/amm/Position/VirtualPositionsList'
import AlcorButton from '~/components/AlcorButton'
import ClaimAllButton from '~/components/amm/Position/PositionsClaimAllButton'

export default {
  name: 'WalletLiquidityPools',
  components: {
    PositionsList,
    AlcorButton,
    VirtualPositionsList,
    ClaimAllButton,
  },
  data: () => ({
    search: '',
  }),
}
</script>

<style scoped lang="scss">
.table-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;

  .el-input {
    max-width: 300px;
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
