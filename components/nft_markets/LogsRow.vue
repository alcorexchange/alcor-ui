<template lang="pug">
.row.logs-row.m-2.py-2
  .col-2.d-flex.p-2.align-items-center
    a(href='#') {{ data.name }}
  .log-data-field.col-6.p-0
    .d-flex.flex-wrap.field-row(
      v-for='(item, index) in logDataFields',
      :key='index'
    )
      .col-7.left-field.p-2 {{ item }}
      .col-5.right-field.p-2 {{ data.data[item] }}
  .d-flex.flex-fill.p-2.align-items-center
    div {{ +data.created_at_time | moment("MM/DD/YYYY HH:mm a") }}
</template>
<script>
export default {
  props: ['data'],
  name: 'TransferRow',
  data() {
    return {}
  },
  computed: {
    logDataFields() {
      if (this.data) {
        return Object.keys(this.data.data)
      } else return []
    },
  },
}
</script>
<style lang="scss">
.logs-row {
  background: var(--btn-active);
  .el-tab-pane {
    overflow-y: scroll;
    overflow-x: hidden;
    height: 200px;
  }
  .transfer-col {
    display: flex;
  }
  a {
    color: #67c23a !important;
    font-size: 14px !important;
  }
  .coin-icon {
    width: 24px;
    height: 24px;
  }
  .log-data-field {
    border: 1px solid var(--text-contrast);
    .field-row {
      .left-field {
        border-right: 1px solid var(--text-contrast);
      }
      &:not(.field-row:last-child) {
        border-bottom: 1px solid var(--text-contrast);
      }
    }
  }
}
</style>
