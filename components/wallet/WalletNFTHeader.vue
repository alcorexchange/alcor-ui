<template lang="pug">
.wallet-header.alcor-card
  .item
    .title.cancel.fs-12 NFT inventory
    .value
      span.main {{ inventoryCount }}
      span.symbol.cancel NFTs
    .info.cancel.fs-12 = ${{ $systemToUSD(suggestedmedian) }}
  .item
    .title.cancel.fs-12 Active Auctions
    .value
      span.main {{ auctionsCount }}
      span.symbol.cancel NFTs
    .info.cancel.fs-12 = ${{ $systemToUSD(saleVolume) }}
  .item
    .title.cancel.fs-12 Active Listings
    .value
      span.main {{ +auctionsCount + +salesCount }}
      span.symbol.cancel NFTs
    .info.cancel.fs-12 = ${{ $systemToUSD(saleVolume) }}
  .item
    .title.cancel.fs-12 Total Bought
    .value
      span.main {{ boughtVolume }}
      span.symbol.cancel.wax WAX
    .info.cancel.fs-12 = ${{ $systemToUSD(boughtVolume) }}
  .item
    .title.cancel.fs-12 Total Sold
    .value
      span.main {{ saleVolume }}
      span.symbol.cancel.wax WAX
    .info.cancel.fs-12 = ${{ $systemToUSD(saleVolume) }}
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  name: 'WalletHeader',
  data() {
    return {
      inventoryCount: 0,
      auctionsCount: 0,
      salesCount: 0,
      boughtVolume: 0,
      saleVolume: 0,
      suggestedmedian: 0
    }
  },

  computed: {
    ...mapState(['network', 'user']),
    ...mapGetters({
      buyPositionsCount: 'wallet/buyPositionsCount',
      sellPositionsCount: 'wallet/sellPositionsCount',
      pairsCount: 'wallet/pairsCount',
      systemBalance: 'systemBalance',
      network: 'network'
    })
  },
  watch: {
    user(newUser, oldUser) {
      if (!oldUser && newUser) {
        this.getInventoryCounts(this.user.name)
        this.getAuctionsCounts(this.user.name)
        this.getInventoryValue(this.user.name)
        this.getSalesCounts(this.user.name)
        this.getInventorySuggestedmedian(this.user.name)
      }
    }
  },
  mounted() {
    if (this.user) {
      this.getInventoryCounts(this.user.name)
      this.getAuctionsCounts(this.user.name)
      this.getInventoryValue(this.user.name)
      this.getSalesCounts(this.user.name)
      this.getInventorySuggestedmedian(this.user.name)
    }
  },
  methods: {
    async getInventoryCounts(owner) {
      const data = await this.$store.dispatch('api/getInventoryCounts', {
        owner
      })
      this.inventoryCount = data
    },
    async getAuctionsCounts(owner) {
      const data = await this.$store.dispatch('api/getAuctionsCounts', {
        owner
      })
      this.auctionsCount = data
    },
    async getSalesCounts(owner) {
      const data = await this.$store.dispatch('api/getSalesCounts', {
        owner
      })
      this.salesCount = data
    },
    async getInventoryValue(owner) {
      const data = await this.$store.dispatch('api/getAccountValue', {
        owner
      })
      this.boughtVolume =
        data.result.buy_volume / Math.pow(10, data.symbol.token_precision)
      this.saleVolume =
        data.result.sell_volume / Math.pow(10, data.symbol.token_precision)
    },
    async getInventorySuggestedmedian(owner) {
      const data = await this.$store.dispatch(
        'api/getInventorySuggestedmedian',
        {
          owner
        }
      )
      this.suggestedmedian =
        data[0].suggested_median / Math.pow(10, data[0].token_precision)
    }
  }
}
</script>

<style scoped lang="scss">
.main {
  font-size: 1.1rem;
  font-weight: 500;
  padding-right: 4px;
}

.symbol {
  font-size: 0.86rem;
}

.title,
.value,
.info {
  padding: 2px;
}

.wallet-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.line {
  margin: 0 4px;
  width: 2px;
}

@media only screen and (max-width: 840px) {
  .wallet-header {
    justify-content: center;
    background: transparent;
    padding: 0;
  }

  .item {
    background: var(--background-color-secondary);
    padding: 10px;
    margin: 4px;
    border-radius: var(--radius);
  }
}

@media only screen and (max-width: 540px) {
  .wallet-header {
    flex-direction: column;
  }

  .item {
    background: var(--background-color-secondary);
    padding: 10px;
    margin: 4px;
    border-radius: var(--radius);
  }
}
</style>
