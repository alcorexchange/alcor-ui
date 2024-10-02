<template lang="pug">
.wallet-row(@click="$router.push('/analytics/tokens/' + item.id)").hoverable.pointer
  .token
    .token-image
      token-image(:src='$tokenLogo(item.currency, item.contract)', :height="isMobile ? '20' : '30'")
    .asset
      el-dropdown(v-if="isMobile" trigger="click" @command="handleDropdownClick")
        //- click.stop prevents the click event to being sent to .wallet-row so navigation does not happen
        .asset__drop(v-if="isMobile" @click.stop)
          .asset__name {{ item.currency }}
          i.el-icon-caret-bottom
        el-dropdown-menu.dropdown(slot="dropdown" placement="botom-start" v-if="useActions")
          // CEX deposit
          //- template(v-if="network.name == 'wax' && item.contract == 'usdt.alcor'")
            alcor-button
            //el-button(type="text" @click="$emit('openDeposit')").hover-opacity {{ $t('Deposit') }}

          el-dropdown-item(command="openTransfer") {{ $t('Transfer') }}
          el-dropdown-item(command="pools") {{ $t('Pools') }}
          el-dropdown-item(command="trade") {{ $t('Trade') }}

      .asset__name(v-else) {{ item.currency }}
      .asset__contract.cancel {{ item.contract }}
  .amount(:class="{'acc': !useActions}")
    .amount__base {{ item.amount }}
    .amount__usd.cancel ${{ item.usd_value | commaFloat }}
  .amount(:class="{'acc': !useActions}")
    .amount__base {{ item.amount | commaFloat(4) }}
    .amount__usd.cancel ${{ item.usd_value | commaFloat }}
  //.actions(v-if="!isMobile && useActions")
  .actions(v-if="!isMobile && useActions")
    // OLD CEX DEPOSIT BUTTONS
    //- template(v-if="network.name == 'wax' && item.contract == 'usdt.alcor'")
    //-   .p4.mr-3
    //-     alcor-button(@click="$emit('openWithdraw', item)")
    //-       i.el-icon-upload2
    //-       | Withdraw

    //-   .p4.mr-3
    //-     alcor-button(@click="$emit('openDeposit', item)")
    //-       i.el-icon-download
    //-       | Deposit

    // USDT CEX DEPOSIT BUTTONS
    template(v-if="network.name == 'wax' && item.contract == 'usdt.alcor'")
      el-button(size="medium" type="text" @click.stop="$emit('openWithdraw', item)").hover-opacity Withdraw
      //el-button(size="medium" type="text" @click.stop="$emit('openDeposit', item)").hover-opacity Deposit

    template(v-if="network.name == 'wax' && item.contract == 'eth.token'")
      el-button(size="medium" type="text" @click.stop="openInNewTab('https://bridge.mycloudwallet.com')").hover-opacity Bridge

    template(v-if="item.contract.includes('ibc.') || item.contract.includes('usdt.alcor')")
      el-button(size="medium" type="text" @click.stop="$router.push('/bridge')").hover-opacity Bridge

    el-button(size="medium" type="text" @click.stop="$emit('openTransfer', item)").hover-opacity {{ $t('Transfer') }}
    el-button(size="medium" type="text" @click.stop="$emit('pools', item)").hover-opacity {{ $t('Swap') }}
    el-button.hover-opacity(size="medium" type="text" @click.stop="$emit('trade', item)") {{ $t('Trade') }}
</template>

<script>
import TokenImage from '@/components/elements/TokenImage'
import { mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { TokenImage, AlcorButton },
  props: ['item', 'useActions'],

  computed: {
    ...mapState(['network']),
  },

  methods: {
    handleDropdownClick(action) {
      this.$emit(action, this.item)
    },
  },
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
