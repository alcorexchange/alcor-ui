<template lang="pug">
.row.mt-4
  .col-8.m-auto
    el-tabs(type='border-card')
      el-tab-pane(label='Swap')
        Swap

      el-tab-pane(label='Send') Send
      el-tab-pane(label='Pool') Pool
</template>


<script>
import Swap from '~/components/pools/Swap'


export default {
  components: {
    Swap
  }
}

</script>
