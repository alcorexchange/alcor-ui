<template lang='pug'>
.wallet-row
  .token
    .token-image
      token-image(:src='$tokenLogo(item.currency, item.contract)', :height="isMobile ? '20' : '30'")
    .asset
      el-dropdown(v-if="isMobile" trigger="click")
        .asset__drop(v-if="isMobile")
          .asset__name {{ item.currency }}
          i.el-icon-caret-bottom
        el-dropdown-menu.dropdown(slot="dropdown" placement="botom-start" v-if="useActions")
          el-button(type="text" @click="$emit('openDeposit')").hover-opacity {{ $t('Deposit') }}
          el-button(type="text" @click="$emit('openWithdraw', item)").hover-opacity {{ $t('Transfer') }}
          el-button(type="text" @click="$emit('pools', item)").hover-opacity {{ $t('Pools') }}
          el-button.hover-opacity(type="text" @click="$emit('trade', item)") {{ $t('Trade') }}

      .asset__name(v-else) {{ item.currency }}
      .asset__contract.cancel {{ item.contract }}
  .amount(:class="{'acc': !useActions}")
    .amount__base {{ item.amount | commaFloat(4) }}
    .amount__usd.cancel ${{ item.usd_value | commaFloat }}
  .amount(:class="{'acc': !useActions}")
    .amount__base {{ item.amount | commaFloat(4) }}
    .amount__usd.cancel ${{ item.usd_value | commaFloat }}
  .actions(v-if="!isMobile && useActions")
    el-button(size="medium" type="text" @click="$emit('openDeposit')").hover-opacity {{ $t('Deposit') }}
    el-button(size="medium" type="text" @click="$emit('openWithdraw', item)").hover-opacity {{ $t('Transfer') }}
    el-button(size="medium" type="text" @click="$emit('pools', item)").hover-opacity {{ $t('Pools') }}
    el-button.hover-opacity(size="medium" type="text" @click="$emit('trade', item)") {{ $t('Trade') }}
</template>

<script>
import TokenImage from '@/components/elements/TokenImage'

export default {
  components: { TokenImage },
  props: ['item', 'useActions']
}
</script>

<style scoped lang="scss">
.dropdown {
  display: flex;
  flex-direction: column;
  width: 150px;

  .popper__arrow::after {
    border-bottom-color: red !important;
    border-top-color: red !important;
  }

  .el-button--text {
    color: var(--main-green);
  }

}

.wallet-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 5px 20px;
  border-bottom: 1px solid var(--background-color-base);

  @media only screen and (max-width: 1176px) {
    padding: 5px 10px;
  }

  @media only screen and (max-width: 1176px) {
    justify-content: space-between;
  }

  .token {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 285px;

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }
  }

  .asset {
    &__name {
      font-weight: bold;

      @media only screen and (max-width: 1176px) {
        font-size: 14px;
      }

    }

    &__contract {
      @media only screen and (max-width: 1176px) {
        font-size: 14px;
      }
    }

    &__drop {
      display: flex;
      align-items: center;
      gap: 3px;

      i {
        font-size: 14px;
      }
    }
  }

  .amount {
    width: 250px;
    display: flex;
    gap: 3px;
    flex-direction: column;
    align-items: end;

    &.acc {
      width: 385px;
    }

    @media only screen and (max-width: 1176px) {
      width: 33%;
    }

    &__base {
      font-size: 0.9rem;
    }

    &__usd {
      font-size: 0.8rem;
    }
  }

  .actions {
    width: 500px;
    display: flex;
    justify-content: right;

    @media only screen and (max-width: 1176px) {
      width: 0;
    }

    .el-button--text {
      color: var(--main-green);
      font-weight: 400;
    }
  }
}
</style>
