<template lang="pug">
#log-table-component
  el-table(
    :data="offerLog"
    stripe
    style="width: 100%"
  )
    el-table-column(
      prop="name"
      label="Event"
      width="150"
    )
    el-table-column(
      prop="data"
      label="Data"
    )
      template(slot-scope="scope")
        .d-flex.gap-16.fs-12
          .d-flex.gap-4(v-for="[key, value] of Object.entries(scope.row.data)")
            span {{ key }}:
            span {{ value || '""' }}
    el-table-column(
      prop="created_at_time"
      label="Date"
      width="200"
    )
      template(slot-scope="scope")
        span {{ date(scope.row.created_at_time) }}

    el-table-column(
      prop="txid"
      label="Tx"
      width="50"
    )
      template(slot-scope="scope")
        a.color-wax(:href="`https://waxblock.io/transaction/${scope.row.txid}`")
          i.el-icon-link

</template>

<script>
export default {
  props: ['offerLog'],
  methods: {
    date(d) {
      return new Date(+d).toLocaleString()
    }
  }
}
</script>

<style lang="scss">
#log-table-component {
  padding: 24px;
  border-radius: 1rem;
  background-color: var(--bg-alter-2);

  .el-table {
    &::before {
      background-color: var(--bg-alter-2);
    }

    background: var(--bg-alter-2);
    .el-table__body-wrapper {
      border-radius: 0.5rem;

      tr.el-table__row--striped td {
        background-color: var(--bg-alter-2);
        border-bottom: none;
      }
    }
    .cell {
      padding: 0 15px;
    }

    th {
      background: var(--bg-alter-2);
      border: none;
    }
  }
}
</style>
