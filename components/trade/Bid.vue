<template lang="pug">
  .wrapper
    TabUi(
      :tabs="tabsBid"
      :selectByDefault="bid"
      @tabSelect="setBid($event)"
    )
    SimpleTabUi(
      :tabs="tabsTrade"
      @tabSelect="setTrade($event)"
    )
    .balance
      p {{ bid }} {{ quote_token.symbol.name }}
      p(
        @click="setAmount()"
      ) {{ bid == 'buy' ? baseBalance : tokenBalance | commaFloat }} <i class="el-icon-wallet"></i>
    LimitBid(:bid="bid")
    ButtonUi(
      :type="bid == 'buy' ? 'success' : 'danger'"
      @click.native="actionOrder()"
    ) {{ bid }} {{ quote_token.symbol.name }}
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { tradeMixin } from '~/mixins/trade'

import TabUi from '~/components/UI/Tabs/Tab.vue'
import SimpleTabUi from '~/components/UI/Tabs/SimpleTab.vue'
import LimitBid from '~/components/trade/LimitBid.vue'
import ButtonUi from '~/components/UI/Buttons/Button.vue'
export default {
  components: {
    TabUi,
    SimpleTabUi,
    LimitBid,
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
    setAmount() {
      if (this.bid == 'buy') this.changeTotal({ total: parseFloat(this.baseBalance), type: 'buy' })
      if (this.bid == 'sell') this.changeAmount({ amount: parseFloat(this.tokenBalance), type: 'sell' })
    },
    setBid(e) {
      this.bid = e
      this.$emit('setType', this.bid)
    },
    setTrade(e) {
      this.trade = e
    },
    async actionOrder() {
      let res
      if (this.bid == 'buy') {
        if (parseFloat(this.price_bid) == 0 || this.price_bid == null || isNaN(this.price_bid)) {
          this.$notify({ title: 'Place order', message: 'Specify the price', type: 'error' })
          return
        } else if (parseFloat(this.amount_buy) == 0 || this.amount_buy == null || isNaN(this.amount_buy)) {
          this.$notify({ title: 'Place order', message: 'Specify the number of', type: 'error' })
          return
        }

        res = await this.fetchBuy(this.trade)
      }

      if (res.err) {
        this.$notify({ title: 'Place order', message: res.desc, type: 'error' })
      } else {
        this.$notify({ title: 'Buy', message: 'Order placed!', type: 'success' })
      }

    }
  },
}
</script>

<style lang="scss" scoped>
  .wrapper {
    display: grid;
    grid-gap: 10px;
    padding: 10px 15px;
    .balance {
      display: flex;
      justify-content: space-between;
      p {
        margin: 0;
        text-transform: capitalize;
      }
    }
  }
</style>
