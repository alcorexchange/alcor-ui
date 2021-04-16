<template lang="pug">
.earn
    h3.label My Deposits
    el-radio-group.custom-radio(size="small")
        el-radio-button(label="All Type")
        el-radio-button(label="Liquidity Pools")
        el-radio-button(label="Liquidity mining")
        el-radio-button(label="Staking")
    .table.el-card.is-always-shadow
    h3.label Earn
    el-radio-group.custom-radio(size="small")
        el-radio-button(label="All Type")
        el-radio-button(label="Liquidity Pools")
        el-radio-button(label="Liquidity mining")
        el-radio-button(label="Staking")
    .table.el-card.is-always-shadow
    //- el-table.market-table(
    //-   style='width: 100%',
    //- )
    //-   el-table-column(label='Pair', prop='date', :width='isMobile ? 150 : 280')
    //-     template(slot-scope='scope')
    //-       TokenImage(
    //-         :src='$tokenLogo(scope.row.quote_token.symbol.name, scope.row.quote_token.contract)',
    //-         :height="isMobile? '20' : '30'"
    //-       )

    //-       //span TODO
    //-       //  PairIcons(
    //-       //    :token1="{symbol: scope.row.quote_token.symbol.name, contract: scope.row.quote_token.contract}"
    //-       //    :token2="{symbol: scope.row.base_token.symbol.name, contract: scope.row.base_token.contract}"
    //-       //  )

    //-       span.ml-2
    //-         | {{ scope.row.quote_token.symbol.name }}
    //-         a.text-muted.ml-2(
    //-           :href='monitorAccount(scope.row.quote_token.contract)',
    //-           target='_blank',
    //-           v-if='!isMobile'
    //-         ) {{ scope.row.quote_token.contract }}
    //-         |
    //-         | / {{ scope.row.base_token.symbol.name }}

    //-   el-table-column(
    //-     :label='`Last price`',
    //-     sort-by='last_price',
    //-     align='right',
    //-     header-align='right',
    //-     sortable,
    //-     :sort-orders='["descending", null]'
    //-   )
    //-     template(slot-scope='scope')
    //-       .text-success {{ scope.row.last_price }} {{ !isMobile ? scope.row.base_token.symbol.name : "" }}
    //-   el-table-column(
    //-     :label='`24H Vol.`',
    //-     align='right',
    //-     header-align='right',
    //-     sortable,
    //-     sort-by='volume24',
    //-     :sort-orders='["descending", null]'
    //-   )
    //-     template(slot-scope='scope')
    //-       span.text-mutted {{ scope.row.volume24.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

    //-   el-table-column(
    //-     label='24H',
    //-     prop='name',
    //-     align='right',
    //-     header-align='right',
    //-     sortable,
    //-     width='100',
    //-     sort-by='change24',
    //-     :sort-orders='["descending", null]',
    //-     v-if='!isMobile'
    //-   )
    //-     template(slot-scope='scope', align='right', header-align='right')
    //-       change-percent(:change='scope.row.change24')

    //-   el-table-column(
    //-     label='7D Volume',
    //-     prop='weekVolume',
    //-     align='right',
    //-     header-align='right',
    //-     sortable,
    //-     sort-by='volumeWeek',
    //-     :sort-orders='["descending", null]',
    //-     v-if='!isMobile'
    //-   )
    //-     template(slot-scope='scope')
    //-       span.text-mutted {{ scope.row.volumeWeek.toFixed(2) }} {{ scope.row.base_token.symbol.name }}

    //-   el-table-column(
    //-     label='7D Change',
    //-     prop='weekChange',
    //-     align='right',
    //-     header-align='right',
    //-     sortable,
    //-     sort-by='changeWeek',
    //-     :sort-orders='["descending", null]',
    //-     v-if='!isMobile'
    //-   )
    //-     template(slot-scope='scope')
    //-       change-percent(:change='scope.row.changeWeek')
</template>

<script>
export default {
  name: 'Earn'
}
</script>

<style scoped lang="scss">
.label {
  font-size: 1.386rem;
  margin-bottom: 24px;
}
.custom-radio {
  margin-bottom: 22px;
}
.earn {
  padding: 28px 0;
}
</style>
