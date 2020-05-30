<template lang="pug">
// FIXME
.row.mt-3
  .col-lg-3.pr-0
    //el-card
      .lead Pools

    .row
      .col-lg-7
        el-input(placeholder="Search pool" size="small")
      .col-lg-5
        el-button(type="primary" size="small").float-right Create pool
    hr
    .row
      .col
        div(v-for="pool in pools")
          el-button(plain size="small").w-100
            .d-flex.justify-content-around
              div
                TokenImage(:src="$tokenLogo(pool.pool1.quantity.symbol.code().to_string(), pool.pool1.contract)" height="25")
                span.ml-2 {{ pool.pool1.quantity.symbol.code().to_string() }}
              div
                TokenImage(:src="$tokenLogo(pool.pool2.quantity.symbol.code().to_string(), pool.pool2.contract)" height="25")
                span.ml-2 {{ pool.pool2.quantity.symbol.code().to_string() }}




    //el-menu.el-menu-vertical-demo(default-active='2', @open='handleOpen', @close='handleClose', :collapse='isCollapse')
      el-menu-item(index='1-1') item one
        h1 olol
        span asdfasdf
  .col-lg-9
    Swap

    //el-tabs(type='border-card')
      el-tab-pane(label='Swap')
        Swap

      el-tab-pane(label='Open pool')
        Create

      //el-tab-pane(label='Liquidity Provider')
        Liquidity
</template>

<script>
import { mapState } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

import Swap from '~/components/pools/Swap'
import Create from '~/components/pools/Create'

export default {
  components: {
    Swap,
    Create,
    TokenImage
    //Liquidity
  },

  computed: {
    ...mapState('pools', ['pools'])
  }
}
</script>
