<template lang="pug">
.el-card.resource-page-card
  .header
    i.el-icon-present
    span.text {{ $t("Validators") }}
  div
    el-table.market-table(
    :data='list',
    style='width: 100%',
    height="400"
    )
      el-table-column(:label='$t("Rank")' :width="isMobile ? 50 : 68")
        template(#default='{ row }') {{ row.rank }}
      el-table-column(:label='$t("Guilds")')
        template(slot-scope='{row}')
          .asset-container
            .logox
              img(:src="row.logo" v-if="row.logo")
            span {{ row.owner }}
      el-table-column(
        :label='$t("Status")',
      )
        template(slot-scope='{row}')
          //- Can add 'red' or 'yellow' or 'green' class based on status
          .status-container
            .status(:class="{ red: row.rank > 21 }") {{ row.rank > 21 ? 'Standby' : `Top 21` }}
      el-table-column(
        :label='$t("Location")',
        min-width="120"
      )
        template(slot-scope='{row}')
          .fs-12.md-fs-14 {{ row.country }}
      el-table-column(
        :label='$t("Links")',
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
        :label='$t("Votes")',
      )
        template(slot-scope='{row}') {{ row.percentage_votes.toFixed(2) }}%
      el-table-column(
        :label='$t("Total Votes")',
        min-width="100"
      )
        template(slot-scope='{row}')
          .fs-12.md-fs-14 {{ parseInt(row.num_votes) }}
      el-table-column(
        :label='$t("Rewards Per Day")',
        min-width="100"
      )
        template(slot-scope='{row}')
          .fs-12.md-fs-14 {{ row.reward }}
      el-table-column(
        :label='$t("Action")',
      )
        //- TODO: dynamic
        template(slot-scope='{row}')
          el-button.vote(type="text") {{ $t('Vote') }}
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
    let url = `https://www.api.bloks.io/${network}/producers?pageNum=1&perPage=50`

    if (network == 'eos') {
      url = url.replace('eos/', '')
    }

    try {
      const { data } = await this.$axios.get(url)
      this.list = data.producers
    } catch (e) {
      this.$notify({ title: 'Producer fetch error', message: e, type: 'error' })
    }
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

.asset-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

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
  width: 17px;
  height: 20px;
}

.links {
  >* {
    padding: 2px;
  }
}

.vote {
  color: var(--main-green) !important;
}
</style>
