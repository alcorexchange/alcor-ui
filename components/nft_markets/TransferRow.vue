<template lang="pug">
.row.transfer-row.m-2.border-radius5
  .col-2.d-flex.p-2.align-items-center
    a(href="#") Transfer
  .col-6.d-flex.p-2.align-items-center.row
    .col-5.d-flex.align-items-center
      img.mr-1(:src="require('~/assets/images/' + this.data.org_token)")
      a(href="#") {{this.data.org_owner}}
    .col-2.text-center
     img.pl-2(src='~/assets/images/double_arrow.svg')
    .col-5.d-flex.align-items-center
      img.mr-1(:src="require('~/assets/images/' + this.data.new_token)")
      a(href="#") {{this.data.new_owner}}
  .col-4.d-flex.p-2.align-items-center
    div.tab-content-date {{this.data.date}}
</template>
<script>
export default {
  props: ['data'],
  name: 'TransferRow',
  data() {
    return {
    }
  },
}
</script>
<style lang="scss">
.transfer-row {
  background: #161617;
  height: 45px;
  .el-tab-pane{
    overflow-Y: scroll;
    overflow-X: hidden;
    height:200px;
  }
  .transfer-col {
    display: flex;
  }
  a {
    color: #67C23A !important;
    font-size: 14px !important;
  }
}

</style>
