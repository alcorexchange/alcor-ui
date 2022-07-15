<template lang="pug">
// Переделать как табличку element
.deals-history(v-loading='loading')
  .blist.first
    .ltd.first.d-flex.justify-content-around
      span {{ $t('Price') }} ({{ base_token.symbol.name }})
      span {{ $t('Amount') }} ({{ (timesAndSales[id] || {}).showQuote == 'Token' ? quote_token.symbol.name : base_token.symbol.name }})
      span {{ $t('Time') }}
  .orders-list.blist
    a(
      v-for='deal in coloredDeals',
      :href='monitorTx(deal.trx_id)',
      target='_blank'
    )
      .ltd.d-flex.justify-content-around.deal-list(:class='deal.cls')
        span {{ deal.unit_price }}
        //span {{ deal.bid | humanFloat(base_token.symbol.precision) }}
        span {{ showAmount(deal) | commaFloat(3) }}
        span {{ deal.time | moment((timesAndSales[id] || {}).timeformat || 'MM/DD hh:mm:ss') }}
</template>

<script>
import { mapState } from 'vuex'

export default {

  data() {
    return {
      loading: false,
      deals: [],
    }
  },
  computed: {
    ...mapState('market', ['quote_token', 'base_token', 'id']),
    ...mapState('settings', ['timesAndSales']),
    ...mapState(['network']),
    coloredDeals() {
      const maxBid = (this.timesAndSales[this.id] || {})[this.base_token.symbol.name] || null
      const maxAsk = (this.timesAndSales[this.id] || {})[this.quote_token.symbol.name] || null

      return Array.from(this.$store.state.market.deals)
        .sort((a, b) => b.time - a.time)
        .map((h) => {
          if (h.type == 'buymatch') {
            h.cls = 'buy'

            if ((maxBid && h.bid >= maxBid) || (maxAsk && h.ask >= maxAsk)) h.cls += ' max-buymatch'

            h.amount = h.bid
          } else {
            h.cls = 'sell'

            if ((maxAsk && h.bid >= maxAsk) || (maxBid && h.ask >= maxBid)) h.cls += ' max-sellmatch'

            h.amount = h.ask
          }
          return h
        })
    }
  },

  methods: {
    showAmount(deal) {
      if ((this.timesAndSales[this.id] || {}).showQuote == 'Token') {
        return deal.type == 'sellmatch' ? deal.bid : deal.ask
      } else {
        return deal.type == 'sellmatch' ? deal.ask : deal.bid
      }
    }
  }
}
</script>

<style lang="scss">
.deals-history {
  .sell {
    span:first-child {
      color: var(--color-secondary);
    }
  }

  .buy {
    span:first-child {
      color: var(--color-primary);
    }
  }
}


.max-buymatch {
  background: linear-gradient(180deg, var(--background-color-base) 0%, var(--color-primary) 100%), #212121;
}

.max-sellmatch {
  background: linear-gradient(180deg, var(--background-color-base) 0%, var(--color-secondary) 100%), #212121;
}

.blist a {
  all: unset;

  span {
    color: var(--text-grey-thirdly);
  }

}

.deals-history {
  height: 100%;

  .orders-list {
    overflow: auto;
    //height: calc(100% - 53px);
    height: 100%;
  }
}

.time-sale {
  .el-tabs__content {
    height: calc(100% - 30px);
  }

  .el-tab-pane {
    height: 100%;
  }

  .deals-history {
    height: 101%;
  }
}
</style>
