<template lang="pug">
.top-favorite-markets
  .market(v-for="market in favorites")
    .d-flex
      .icon
        TokenImage(
          :src='$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)',
          height='20'
        )
      .name {{ market.symbol }}
    .change
      .red(v-if="market.change24 < 0") {{ market.last_price | commaFloat(5) }} ({{ market.change24 | commaFloat(2) }}%)
      .green(v-else) {{ market.last_price | commaFloat(5) }} ({{ market.change24 | commaFloat(2) }}%)
</template>

<script>
import { mapState } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  computed: {
    ...mapState(['markets', 'network']),
    ...mapState('market', ['id', 'quote_token']),
    ...mapState('settings', ['favMarkets']),

    favorites() {
      return this.markets.filter((i) => this.favMarkets.includes(i.id))
    }
  }
}
</script>

<style lang="scss">
.top-favorite-markets {
  border: 1px solid #212124;
  box-sizing: border-box;
  border-radius: 2px;

  background-color: var(--background-color-base);

  width: 100%;
  display: flex;
  flex-flow: row;
  flex-wrap: nowrap;
  overflow: scroll;

  // TODO
  //position: relative;

  .name {
    margin-left: 6px;
  }

  .market {
    padding: 5px;
    border-right: 1px solid rgba(60, 60, 67, 0.36);
    min-width: 120px;
  }

  .right-shadow {
    // TODO
    //height: 60px;
    //width: 30px;

    //position: absolute;
    //right: 0;
    //top: 0;

    //background: linear-gradient(270deg, #212124 0%, rgba(18, 18, 18, 0) 100%);
  }
}

.top-favorite-markets::-webkit-scrollbar {
  display: none;
}
</style>
