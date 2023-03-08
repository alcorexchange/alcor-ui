<template lang="pug">
.d-flex.gap-6.justify-content-center
  alcor-container.mt-5.swap-widget
    .d-flex.justify-content-between.align-items-center
      .fs-18 {{ $t('Swap') }}
      .d-flex.gap-16.align-items-center
        i.el-icon-refresh.pointer
        settings

    PoolTokenInput.mt-2
    PoolTokenInput.mt-2

    alcor-container.mt-2(:alternative="true")
      el-collapse.default
        el-collapse-item
          template(#title)
            .d-flex.gap-8.py-1
              .disable.fs-12 Rate
              .d-flex.gap-4
                .fs-12 3.6198 BRWL per WAX
                .fs-12.disable (1402,10.01$)
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Expected Output
              .fs-12 79.01222 WAX
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Price Impact
              .fs-12 0%
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Minimum Received after slippage
              .fs-12 79.01222 WAX (0.4%)
          .d-flex.flex-column.gap-4
            .d-flex.justify-content-between.align-items-center
              .fs-12.disable Network fee
              .fs-12 0.00

          alcor-container.mt-2
            el-collapse.default.multiroute
              el-collapse-item
                template(#title)
                  .d-flex.justify-content-between.align-items-center.w-100.p-1
                    .d-flex.gap-8.color-action.align-items-center
                      i.el-icon-connection
                      .fs-12 Multiroute

                    i.el-icon-plus
                .p-1
                  swap-route

    alcor-button.w-100.mt-2(access) Swap WAX to BRWL

</template>

<script>
import AlcorContainer from '~/components/AlcorContainer'
import ReturnLink from '~/components/ReturnLink'
import AlcorCollapse from '~/components/AlcorCollapse'
import AlcorButton from '~/components/AlcorButton'
import PoolTokenInput from '~/components/amm/PoolTokenInput'
import Settings from '~/components/amm/Settings'
import SwapRoute from '~/components/swap/SwapRoute'

export default {
  components: {
    AlcorContainer,
    ReturnLink,
    AlcorCollapse,
    AlcorButton,
    PoolTokenInput,
    Settings,
    SwapRoute
  }
}
</script>

<style lang="scss">
.multiroute {
  .el-collapse-item__arrow {
    display: none !important;
  }

  i.el-icon-plus {
    transition: all 0.3s;
  }

  .is-active {
    i.el-icon-plus {
      transform: rotate(45deg);
    }
  }
}  
</style>

<style lang="scss" scoped>
.swap-widget {
  width: 450px;
}
</style>
