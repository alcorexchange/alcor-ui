<template lang="pug">
.market-top
  .market-list(v-for="(marketList, idx) in [newListings, topGainers, topVolume]")
    .title {{ $t(titles[idx]) }}
    .market-item(v-for="market in marketList" @click="() => $router.push({ name: `trade-index-id___${$i18n.locale}`, params: { id: market.slug } })")
      .item-name
        token-image.token(:src='$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)')
        .token-name  {{ market.quote_token.symbol.name }} / {{ market.base_token.symbol.name }}
      .item-price(v-if="titles[idx] === 'Top Volume'") {{ $systemToUSD(market.base_volume) }}$
      .item-price(v-else) {{ market.last_price.toFixed(5) }}
      change-percent.item-change(:change='market.change24')
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: { TokenImage, ChangePercent },
  props: ['newListings', 'topGainers', 'topVolume'],
  data() {
    return {
      titles: ['New Listings', 'Top Gainers', 'Top Volume']
    }
  }
}
</script>

<style scoped lang="scss">
.market-top {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 2px;

  @media (max-width: 600px) {
    flex-direction: column
  }

}

.market-list {
  background-color: var(--background-color-third);
  width: 33.33%;
  padding: 24px 0;
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;

  @media (max-width: 600px) {
    width: 100%;
    border-radius: 8px;
  }

}

.market-item {
  padding: 4px 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.market-item:hover {
  background-color: var(--background-color-base);
}

.market-list:first-of-type {
  border-radius: 8px 0 0 8px;

  @media (max-width: 600px) {
    border-radius: 8px;
  }

}

.market-list:last-of-type {
  border-radius: 0 8px 8px 0;

  @media (max-width: 600px) {
    border-radius: 8px;
  }

}

.title,
.market-item {
  padding: 4px 24px;
}

.item-name {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 45%;
}

.item-price {
  width: 35%;
}

.item-change {
  width: 15%;
  text-align: right;
}
</style>
