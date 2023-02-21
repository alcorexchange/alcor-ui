<template lang="pug">
el-dropdown(trigger="click")
  .pointer
    i.el-icon-setting.fs-24
  el-dropdown-menu.dropdown(slot="dropdown")
    .p-3.d-flex.flex-column.gap-8
      label {{ $t('Transaction Setting') }}
      label.fs-14.disable {{ $t('Slippage Tolerance') }} %
      .d-flex.gap-4.section-input
        alcor-button(round compact) {{ $t('Auto') }}
        el-input.br-20(:placeholder="$t('Slippage Tolerance %')" size="small")
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton }
}
</script>
