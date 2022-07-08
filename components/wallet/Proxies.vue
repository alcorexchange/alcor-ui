<template lang="pug">
.el-card.resource-page-card
  .header
    i.el-icon-present
    span.text {{ $t("Proxies") }}
  .main
    el-table.market-table(
    :data='mock',
    style='width: 100%',
    )
      el-table-column(:label='$t("Rank")' width="68")
        template(slot-scope='{row}') {{ row.rank }}
      el-table-column(:label='$t("Name")')
        template(slot-scope='{row}')
          .asset-container
            TokenImage(:src="$tokenLogo('', '')" height="25")
            span {{ row.name }}
      el-table-column(
        :label='$t("Account")',
      )
        template(slot-scope='{row}') {{ row.account }}
      el-table-column(
        :label='$t("Proxied Accounts")',
      )
        //- TODO: dynamic
        template(slot-scope='{row}') {{ row.proxiedAccounts }}
      el-table-column(
        :label='$t("Voting For")',
      )
        //- TODO: dynamic
        template(slot-scope='{row}') {{ row.votingFor }}
      el-table-column(
        :label='$t("Action")',
      )
        //- TODO: dynamic
        template(slot-scope='{row}')
          el-button(type="text") Vote
</template>

<script>
export default {
  name: 'RewardsCard',
  data: () => ({
    mock: [
      {
        rank: 1,
        name: 'Bloks.io',
        account: 'bloksioproxy',
        proxiedAccounts: 129421,
        votingFor: 20
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.resource-page-card {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
}
</style>
