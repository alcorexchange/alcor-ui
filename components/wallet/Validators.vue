<template lang="pug">
.el-card.resource-page-card
    .header
        i.el-icon-present
        span.text Validators
    .main
        el-table.market-table(
        :data='mock',
        style='width: 100%',
        )
            el-table-column(label='Rank' width="68")
                template(slot-scope='{row}') {{row.rank}}
            el-table-column(label='Guilds')
                template(slot-scope='{row}')
                    .asset-container
                        TokenImage(:src="$tokenLogo('', '')" height="25")
                        span {{ row.guilds }}
            el-table-column(
                label='Status',
            )
                template(slot-scope='{row}')
                    //- Can add 'red' or 'yellow' or 'green' class based on status
                    .status.red {{row.status}}
            el-table-column(
                label='Location',
            )
                //- TODO: dynamic
                template(slot-scope='{row}') {{ row.location }}
            el-table-column(
                label='Links',
            )
                template(slot-scope='{row}')
                    .links
                        el-link(type="primary" target="_blank" v-if="row.links.website")
                            i.el-icon-copy-document
                        el-link(type="primary" target="_blank" v-if="row.links.website")
                            i.el-icon-copy-document
            el-table-column(
                label='Votes',
            )
                //- TODO: dynamic
                template(slot-scope='{row}') {{ row.votes }}%
            el-table-column(
                label='Total Votes',
            )
                //- TODO: dynamic
                template(slot-scope='{row}') {{ row.totalVotes }}
            el-table-column(
                label='Rewards Per Day',
            )
                //- TODO: dynamic
                template(slot-scope='{row}') {{ row.rewardPerDay }}
            el-table-column(
                label='Action',
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
        guilds: 'alohaeosprod',
        status: 'Top 21',
        location: 'Sweden',
        links: { website: 'test.com', twitter: 'test', telegram: 'test' },
        votes: 4.5,
        totalVotes: 12443412,
        rewardPerDay: 2143.1234
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
.status {
  padding: 8px;
  border-radius: 10px;
  background: var(--hover);
  text-align: center;
  border: 1px solid var(--hover);
  color: var(--text-default);
  &.red {
    border-color: var(--main-red);
  }
  &.green {
    border-color: var(--main-green);
  }
  &.yellow {
    border-color: #f39c12;
  }
}
.links {
  > * {
    padding: 2px;
  }
}
</style>
