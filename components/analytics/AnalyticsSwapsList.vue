<template lang="pug">
  VirtualTable(:table="virtualTableData" @update="handleUpdate").table
    template(#row="{item}")
      .item
        .time {{ item.time | moment('YYYY-MM-DD HH:mm') }}
        .amount.d-flex.flex-column.gap-4.token-amount-items(v-if="pool")
          .amount-item
            TokenImage(
              :src='$tokenLogo(pool.tokenA.symbol, pool.tokenA.contract)',
              height='18'
            )
            .fs-14 {{ item.tokenA }}
            .fs-14 {{ pool.tokenA.symbol }}
          .amount-item
            TokenImage(
              :src='$tokenLogo(pool.tokenB.symbol, pool.tokenB.contract)',
              height='18'
            )
            .fs-14 {{ item.tokenB }}
            .fs-14 {{ pool.tokenB.symbol }}

        .usd(v-if="!isMobile") {{ item.totalUSDVolume | commaFloat }}
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
          width: '150px',
        },
        {
          label: 'Amount',
          value: 'amount',
          width: '200px',
        },
        {
          label: 'USD',
          value: 'usd',
          width: '740px',
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
        itemSize: 66,
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
  },
}
</script>

<style scoped lang="scss">
.item {
  display: flex;
  padding: 10px 20px;
  align-items: center;
  .time {
    width: 150px;
    @media only screen and (max-width: 1176px) {
      width: 50%;
    }
  }
  .amount {
    width: 200px;
    display: flex;
    align-items: flex-end;

    @media only screen and (max-width: 1176px) {
      width: 50%;
    }
  }
  .usd {
    width: 740px;
    display: flex;
    justify-content: flex-end;
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
