<template lang="pug">
  .wrapper
    TabUi(
      class="tab"
      :tabs="tabsBid"
      :selectByDefault="bid"
      @tabSelect="setBid($event)"
    )
    SimpleTabUi(
      :tabs="tabsTrade"
      @tabSelect="setTrade($event)"
    )
    .cards
      .cardBid(
        v-for="card in arrCard"
        :key="card.bid"
        :class="isCardActive(card.bid)"
      )
        .balance
          p(
            @click="setAmount(card.bid)"
          )
            | {{ card.balance | commaFloat }}
            | <i class="el-icon-wallet"></i>
        LimitBid(
          v-if="trade == 'limit'"
          :bid="card.bid"
        )
        MarketBid(
          v-else
          :bid="card.bid"
        )
        ButtonUi(
          :type="card.bid == 'buy' ? 'success' : 'danger'"
          @click.native="actionOrder(card.bid)"
        ) {{ card.bid }} {{ quote_token.symbol.name }}
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { tradeMixin } from '~/mixins/trade'

import TabUi from '~/components/UI/Tabs/Tab.vue'
import SimpleTabUi from '~/components/UI/Tabs/SimpleTab.vue'
import LimitBid from '~/components/trade/LimitBid.vue'
import MarketBid from '~/components/trade/MarketBid.vue'
import ButtonUi from '~/components/UI/Buttons/Button.vue'
export default {
  components: {
    TabUi,
    SimpleTabUi,
    LimitBid,
    MarketBid,
    ButtonUi
  },

  mixins: [tradeMixin],

  props: ['type'],

  data() {
    return {
      tabsBid: [
        { label: 'buy', color: 'aed581' },
        { label: 'sell', color: 'e57373' }
      ],
      tabsTrade: ['limit', 'market'],
      arrCard: [],
      bid: 'buy',
      trade: 'limit'
    }
  },

  computed: {
    ...mapState('market', [
      'quote_token',
      'price_bid',
      'amount_buy',
      'total_buy'
    ]),
    ...mapGetters('market', ['tokenBalance', 'baseBalance'])
  },

  watch: {
    type(val) {
      this.bid = val
    },
    baseBalance(val) {
      this.arrCard[0].balance = this.baseBalance
    },
    tokenBalance(val) {
      this.arrCard[1].balance = this.tokenBalance
    }
  },

  methods: {
    ...mapMutations('market', ['SET_AMOUNT_SELL']),
    ...mapActions('market', [
      'changeTotal',
      'changeAmount',
      'fetchBuy',
      'fetchSell'
    ]),
    setAmount(bid) {
      if (this.trade == 'limit' && bid == 'buy') {
        this.changeTotal({ total: parseFloat(this.baseBalance), type: 'buy' })
      } else if (this.trade == 'market' && bid == 'buy') {
        this.changeAmount({ amount: parseFloat(this.baseBalance), type: 'buy' })
      } else {
        this.changeAmount({ amount: parseFloat(this.tokenBalance), type: 'sell' })
      }
    },
    setBid(e) {
      this.bid = e
      this.$emit('setType', this.bid)
    },
    setTrade(e) {
      this.trade = e
    },
    async actionOrder(bid) {
      let res
      if (bid == 'buy') {
        if (this.trade !== 'market' && (parseFloat(this.price_bid) == 0 || this.price_bid == null || isNaN(this.price_bid))) {
          this.$notify({ title: 'Place order', message: 'Specify the price', type: 'error' })
          return
        } else if (parseFloat(this.amount_buy) == 0 || this.amount_buy == null || isNaN(this.amount_buy)) {
          this.$notify({ title: 'Place order', message: 'Specify the number of', type: 'error' })
          return
        }

        res = await this.fetchBuy(this.trade)
      } else {
        if (this.trade !== 'market' && (parseFloat(this.price_bid) == 0 || this.price_bid == null || isNaN(this.price_bid))) {
          this.$notify({ title: 'Place order', message: 'Specify the price', type: 'error' })
          return
        } else if (parseFloat(this.amount_sell) == 0 || this.amount_sell == null || isNaN(this.amount_sell)) {
          this.$notify({ title: 'Place order', message: 'Specify the number of', type: 'error' })
          return
        }

        res = await this.fetchSell(this.trade)
      }

      if (res.err) {
        this.$notify({ title: 'Place order', message: res.desc, type: 'error' })
      } else {
        this.$notify({ title: bid == 'buy' ? 'Buy' : 'Sell', message: 'Order placed!', type: 'success' })
      }

    },
    isCardActive(bid) {
      if (bid == this.bid) return 'active'
      else return ''
    }
  },

  async mounted() {
    const cards = [
      {
        balance: this.baseBalance,
        bid: 'buy'
      },
      {
        balance: this.tokenBalance,
        bid: 'sell'
      }
    ]
    this.arrCard = cards
  }
}
</script>

<style lang="scss" scoped>
  .wrapper {
    display: grid;
    grid-gap: 15px;
    align-content: baseline;
    @media (max-width: 1023px) {
      padding: 5px 10px;
    }
    .cards {
      .cardBid {
        display: none;
        &.active {
          display: block;
        }
      }
    }
    .balance {
      display: flex;
      justify-content: end;
      p {
        margin: 0;
        text-transform: capitalize;
      }
    }
  }
</style>
