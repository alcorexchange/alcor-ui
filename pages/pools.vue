<template lang="pug">
.row.mt-4
  .col-8.m-auto
    el-tabs(type='border-card')
      el-tab-pane(label='Swap')
        Swap

      el-tab-pane(label='Open pool')
        Create

      //el-tab-pane(label='Liquidity Provider')
        Liquidity
</template>

<script>
import Swap from '~/components/pools/Swap'
import Create from '~/components/pools/Create'
import Liquidity from '~/components/pools/Create'

export default {
  components: {
    Swap,
    Create,
    Liquidity
  }
}
</script>
