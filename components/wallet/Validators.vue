<template lang="pug">
.el-card.resource-page-card
    .header
        i.el-icon-present
        span.text Validators
    .main
        el-table.market-table(
        :data='list',
        style='width: 100%',
        height="400"
        )
            el-table-column(label='Rank' width="68")
                template(#default='{row}') {{row.rank}}
            el-table-column(label='Guilds')
                template(slot-scope='{row}')
                    .asset-container
                      .logox
                        img(:src="row.logo" v-if="row.logo")
                      span {{ row.owner }}
            el-table-column(
                label='Status',
            )
                template(slot-scope='{row}')
                    //- Can add 'red' or 'yellow' or 'green' class based on status
                    .status-container
                      .status(:class="{red: row.rank > 21}") {{row.rank > 21 ? 'Standby' : `Top 21`}}
            el-table-column(
                label='Location',
            )
                template(slot-scope='{row}') {{ row.country }}
            el-table-column(
                label='Links',
            )
                template(slot-scope='{row}')
                    .links
                        a(:href="row.url" target="_blank" v-if="row.url")
                          img.social-icon(src="@/assets/icons/linkweb.svg")
                        a(:href="`http://t.me/${row.telegram}`" target="_blank" v-if="row.telegram")
                          img.social-icon(src="@/assets/icons/linktg.svg")
                        a(:href="`http://twitter.com/${row.twitter}`" target="_blank" v-if="row.twitter")
                          img.social-icon(src="@/assets/icons/linktw.svg")
            el-table-column(
                label='Votes',
            )
                template(slot-scope='{row}') {{ row.percentage_votes.toFixed(2) }}%
            el-table-column(
                label='Total Votes',
            )
                template(slot-scope='{row}') {{ parseInt(row.num_votes) }}
            el-table-column(
                label='Rewards Per Day',
                min-width="120"
            )
                template(slot-scope='{row}') {{ row.reward }}
            el-table-column(
                label='Action',
            )
                //- TODO: dynamic
                template(slot-scope='{row}')
                    el-button.vote(type="text") Vote
</template>

<script>
export default {
  name: 'RewardsCard',
  data: () => ({
    list: [],
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
  }),

  async mounted() {
    const network = this.$store.state.network.name
    const { data } = await this.$axios.get(
      `https://www.api.bloks.io/${network}/producers?pageNum=1&perPage=50`
    )
    console.log(data)
    this.list = data.producers
  }
}
</script>

<style lang="scss" scoped>
.resource-page-card {
  display: flex;
  flex-direction: column;
}
.status-container {
  display: flex;
}
.status {
  padding: 8px 12px;
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
.asset-container {
  display: flex;
  align-items: center;
  .logox {
    margin-right: 8px;
    img {
      width: 20px;
      height: 20px;
    }
  }
  span {
    white-space: nowrap;
  }
}
.social-icon {
  width: 20px;
  height: 20px;
}
.links {
  > * {
    padding: 2px;
  }
}
.vote {
  color: var(--main-green) !important;
}
</style>
