<template lang="pug">
.row
  .col-lg-2
    //.lead.pl-3.mb-2 Cross-Chain tools
    el-menu.el-menu-vertical-demo(router default-active='2')
      el-menu-item(index='/cross-chain/swap')
        i.el-icon-refresh
        span {{ $t('Swap') }}
      el-menu-item(index='/cross-chain/second')
        span {{ $t('Second') }}

  .col-lg-10
    router-view

</template>
