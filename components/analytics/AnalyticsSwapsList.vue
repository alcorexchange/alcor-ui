<template lang="pug">
  VirtualTable(:table="virtualTableData" v-if="pool" @update="handleUpdate").table
    template(#row="{item}")
      .item.fs-14.pointer(@click="handleItemClick(item.trx_id)")
        .time {{ item.time | moment('YYYY-MM-DD HH:mm') }}

        .in.d-flex.flex-column.gap-4.token-amount-items(v-if="!isMobile")
          .amount-item
            template(v-if="item.tokenA > 0")
              TokenImage(
                :src='$tokenLogo(pool.tokenA.symbol, pool.tokenA.contract)',
                height='18'
              )
              div {{ item.tokenA }}
              div {{ pool.tokenA.symbol }}
            template(v-if="item.tokenA < 0")
              TokenImage(
                :src='$tokenLogo(pool.tokenB.symbol, pool.tokenB.contract)',
                height='18'
              )
              div {{ item.tokenB }}
              div {{ pool.tokenB.symbol }}

        .out.d-flex.flex-column.gap-4.token-amount-items
          .amount-item
            template(v-if="item.tokenB < 0")
              TokenImage(
                :src='$tokenLogo(pool.tokenB.symbol, pool.tokenB.contract)',
                height='18'
              )
              div {{ -item.tokenB }}
              div {{ pool.tokenB.symbol }}

            template(v-if="item.tokenB > 0")
              TokenImage(
                :src='$tokenLogo(pool.tokenA.symbol, pool.tokenA.contract)',
                height='18'
              )
              div {{ -item.tokenA }}
              div {{ pool.tokenA.symbol }}

        .usd(v-if="!isMobile") ${{ item.totalUSDVolume | commaFloat(2) }}
        .wallet(v-if="!isMobile")
          a(:href="monitorAccount(item.recipient)" target="_blank" @click.stop).hover-opacity {{ item.recipient }}
</template>

<script>
import VirtualTable from '@/components/VirtualTable'
import TokenImage from '~/components/elements/TokenImage'

export default {
  name: 'AnalyticsSwapsList',
  components: {
    VirtualTable,
    TokenImage,
  },

  props: ['pool'],

  data: () => ({
    skip: 0,
    limit: 25,
    swaps: [],
  }),

  computed: {
    virtualTableData() {
      const header = [
        {
          label: 'Time',
          value: 'time',
          width: '200px',
        },
        {
          label: 'In',
          value: 'in',
          width: '200px',
          desktopOnly: true,
        },
        {
          label: 'Out',
          value: 'out',
          width: '200px',
        },
        {
          label: 'USD',
          value: 'usd',
          width: '200px',
          desktopOnly: true,
        },
        {
          label: 'Recipient',
          value: 'recipient',
          width: '280px',
          desktopOnly: true,
        },
      ]

      const data = this.swaps.map((item) => ({
        ...item,
        id: item._id,
      }))

      return {
        header,
        data,
        itemSize: 61,
        pageMode: true,
      }
    },
  },

  mounted() {
    this.getSwaps()
  },

  methods: {
    async getSwaps() {
      const { skip, limit } = this
      const params = { skip, limit }

      const { data } = await this.$axios.get(`/v2/swap/pools/${this.$route.params.id}/swaps`, { params })

      if (data.length) {
        this.swaps.push(...data)
      }
    },
    handleUpdate([start, end]) {
      if (end === this.skip + this.limit) {
        this.skip += this.limit
        this.getSwaps()
      }
    },

    handleItemClick(tx) {
      this.openInNewTab(this.monitorTx(tx))
    },
    handleAccountClick(acc) {
      this.openInNewTab(this.monitorAccount(acc))
    },
  },
}
</script>

<style scoped lang="scss">
.item {
  display: flex;
  padding: 20px 20px;
  align-items: center;

  @media only screen and (max-width: 1176px) {
    padding: 10px;
  }

  .time {
    width: 200px;
    @media only screen and (max-width: 1176px) {
      width: 50%;
    }
  }
  .in,
  .out {
    width: 200px;
    display: flex;
    align-items: flex-end;

    @media only screen and (max-width: 1176px) {
      width: 50%;
    }
  }
  .usd {
    width: 200px;
    display: flex;
    justify-content: flex-end;
  }

  .wallet {
    width: 280px;
    display: flex;
    justify-content: flex-end;
    a {
      color: var(--text-default);
    }
  }

  .amount-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.86rem;
  }
}
.table {
  ::v-deep {
    .header.mobile .header__column {
      @media only screen and (max-width: 1176px) {
        width: 50% !important;
      }
    }
  }
}
</style>
