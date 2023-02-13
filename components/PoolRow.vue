<template lang="pug">
#pool-row-component.d-flex.align-items-center.p-3
  .icons
    pair-icons(
      :token1="pool.input"
      :token2="pool.output"
    )
  .d-flex.align-items-center.gap-10.name
    .fs-14 {{ pool.input.symbol }} / {{ pool.output.symbol }}
    .tag {{ pool.percent }}%
  .range.d-flex.flex-column
    .d-flex.align-items-center.gap-4
      .indicator(:class="{ 'in-range': pool.inRange }")
      .fs-10 {{ pool.inRange ? 'In Range': 'Out of Range' }}
    .d-flex.align-items-center.gap-6
      .fs-14.disable MIN
      .fs-14.contrast {{ pool.min }}
      i.el-icon-sort.rot
      .fs-14.disable MAX
      .fs-14.contrast {{ pool.max }}
  .earning.d-flex.flex-column.gap-4
    .d-flex.align-items-center.gap-4
      token-image.token(:src='$tokenLogo(pool.input.symbol, pool.input.contract)')
      .fs-12.earn.d-flex.gap-4(:class="{ red: pool.inputEarning < 0 }")
        span {{ pool.inputEarning > 0 ? '+': '' }}{{ pool.inputEarning | commaFloat }}
        span {{ pool.input.symbol }}
    .d-flex.align-items-center.gap-4
      token-image.token(:src='$tokenLogo(pool.output.symbol, pool.output.contract)')
      .fs-12.earn.d-flex.gap-4(:class="{ red: pool.outputEarning < 0 }")
        span {{ pool.outputEarning > 0 ? '+': '' }}{{ pool.outputEarning | commaFloat }}
        span {{ pool.output.symbol }}
  .actions.d-flex.gap-16
    router-link(:to="{ name: `manage-liquidity-id___${$i18n.locale}`, params: { id: pool.id } }")
      .action-link.manage Manage
    .action-link.claim Claim

</template>

<script>
import PairIcons from '~/components/PairIcons'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: { PairIcons, TokenImage },
  props: ['pool']
}
</script>

<style lang="scss">
#pool-row-component {
  .rot {
    transform: rotate(90deg);
  }
  .icons {
    width: 50px;
  }
  .name {
    width: 150px;
  }
  .range {
    width: 200px;
  }
  .earning {
    width: 150px;
  }
  .actions {
    width: 150px;
  }

  .tag {
    border: var(--border-1);
    background: var(--bg-alter-2);
    font-size: 10px;
    line-height: 12px;
    padding: 4px;
    border-radius: 4px;
  }
  .indicator {
    width: 8px;
    height: 8px;

    background: var(--disabled-indicator);
    border-radius: 2px;

    &.in-range {
      background: var(--access-indicator);
    }
  }
  .token {
    width: 12px;
    height: 12px;
  }
  .earn {
    color: var(--main-green);
    &.red {
      color: var(--main-red);
    }
  }
  .action-link {
    text-decoration: underline;
    cursor: pointer;
    &.manage {
      color: #80A1C5;
    }
    &.claim {
      color: #66C167;
    }
  }

}
</style>
