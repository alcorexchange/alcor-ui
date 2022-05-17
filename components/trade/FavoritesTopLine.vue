<template lang="pug">
.top-favorite-markets
  .market.pointer(
    v-for="market in favorites",
    @click="() => setMarket(market)",
    :class='activeFavClassName(market.id)',
    )
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
  },

  methods: {
    setMarket(market) {
      if (this.id == market.id) return

      if (!isNaN(this.id)) {
        this.$store.dispatch('market/unsubscribe', this.id)
      }

      this.$router.push(
        { name: 'trade-index-id', params: { id: market.slug } },
        () => this.loading = false,
        () => this.loading = false
      )
    },

    activeFavClassName(id) {
      return this.id === id ? 'active' : ''
    }
  }
}
</script>

<style lang="scss">
.top-favorite-markets {
  border: 1px solid #212124;
  box-sizing: border-box;
  border-radius: 2px;

  background-color: var(--table-background);

  width: 100%;
  display: flex;
  flex-flow: row;
  flex-wrap: nowrap;
  overflow: scroll;

  // TODO
  //position: relative;
  &::after {
    pointer-events: none;
    /* ignore clicks */
    content: "";
    position: absolute;
    z-index: 10;
    height: 100%;
    left: 0;
    bottom: 0;
    width: 100%;
    /* Permalink - use to edit and share this gradient: http://colorzilla.com/gradient-editor/#000000+0,000000+50,000000+50,000000+100&1+0,0+50,1+100 */
    background: -moz-linear-gradient(-45deg, rgba(33, 33, 33, 1) 0%, rgba(0, 0, 0, 0) 5%, rgba(0, 0, 0, 0) 95%, rgba(33, 33, 33, 1) 100%);
    /* FF3.6-15 */
    background: -webkit-linear-gradient(-45deg, rgba(33, 33, 33, 1) 0%, rgba(0, 0, 0, 0) 5%, rgba(0, 0, 0, 0) 95%, rgba(33, 33, 33, 1) 100%);
    /* Chrome10-25,Safari5.1-6 */
    background: linear-gradient(90deg, rgba(33, 33, 33, 1) 0%, rgba(0, 0, 0, 0) 5%, rgba(0, 0, 0, 0) 95%, rgba(33, 33, 33, 1) 100%);
    /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#000000', endColorstr='#000000', GradientType=1);
    /* IE6-9 fallback on horizontal gradient */
  }

  .name {
    margin-left: 6px;
    font-size: 14px;
    align-self: center;
  }

  .change {
    font-size: 12px;
  }

  .market {
    padding: 8px 16px 8px 8px;
    border-right: 1px solid rgba(60, 60, 67, 0.36);
    min-width: 157px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .market.active {
    background: #282828;
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
