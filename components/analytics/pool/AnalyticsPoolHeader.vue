<template lang="pug">
.analytics-pool-header.mb-3
  .start
    ReturnLink.return-link.p-2
    .name-and-image
      PairIcons.pair-icons(
        size="22"
        offset="20%"
        :token1="{contract: pool.tokenA.contract, symbol: pool.tokenA.symbol}"
        :token2="{contract: pool.tokenB.contract, symbol: pool.tokenB.symbol}"
      )
      .name.fs-32
        nuxt-link(:to="'/analytics/tokens/' + pool.tokenA.id").token-link {{ pool.tokenA.symbol }}
        |  /
        nuxt-link(:to="'/analytics/tokens/' + pool.tokenB.id").token-link  {{ pool.tokenB.symbol }}
    Tag.ml-1 {{ pool.fee / 10000 }}%
  .end
    AlcorButton(tag="nuxt-link" :to="toSwap") Swap
    AlcorButton(tag="nuxt-link" :to="toAddLiquidity") Add Liquidity
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
import PairIcons from '@/components/PairIcons'
import Tag from '~/components/elements/Tag.vue'
import ReturnLink from '~/components/ReturnLink.vue'
export default {
  name: 'AnalyticsTokenHeader',

  props: ['pool'],

  components: {
    AlcorButton,
    PairIcons,
    ReturnLink,
    Tag,
  },

  computed: {
    toSwap() {
      return this.localeRoute({
        path: '/swap',
        query: {
          input: this.pool.tokenA.id,
          output: this.pool.tokenB.id,
        },
      })
    },
    toAddLiquidity() {
      return this.localeRoute({
        path: '/positions/new',
        query: {
          left: this.pool.tokenA.id,
          right: this.pool.tokenB.id,
        },
      })
    },
  },
}
</script>

<style scoped lang="scss">
.token-link {
  cursor: pointer;
  color: inherit;

  &:hover {
    color: var(--text-disable);
  }
}

.analytics-pool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.start {
  display: flex;
  gap: 8px;
  align-items: center;
  .name-and-image {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .contract {
    color: var(--text-disable);
    margin: 0 4px;
  }
  .name,
  .price {
    line-height: 1.2;
  }
}
.end {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media only screen and (max-width: 600px) {
  .analytics-pool-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
    .end {
      align-self: flex-end;
    }
  }
}
</style>
