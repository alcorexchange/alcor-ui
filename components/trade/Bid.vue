<template lang="pug">
  .wrapper
<<<<<<< HEAD
    TabUi(
=======
    .info
      el-switch(
        class="free-cpu"
        v-if="['eos'].includes(network.name) && user"
        v-model="funPayForUser"
        inactive-text="Free CPU"
      )
      el-button(
        class="swap"
        v-if="relatedPool"
        type="text"
        @click="goToPool"
      ) SWAP ({{ relatedPool.rate }} {{ base_token.symbol.name }})
      FeeRate
    TabUi(
      class="tab"
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
      :tabs="tabsBid"
      :selectByDefault="bid"
      @tabSelect="setBid($event)"
    )
    SimpleTabUi(
      :tabs="tabsTrade"
      @tabSelect="setTrade($event)"
    )
<<<<<<< HEAD
    .balance
      p {{ bid }} {{ quote_token.symbol.name }}
      p(@click="setAmount()") {{ bid == 'buy' ? baseBalance : tokenBalance }} <i class="el-icon-wallet"></i>
    //- TODO В идеале заменить ElementUI на самописные компоненты, так как есть существенные баги в ElementUI
    el-form(ref="form" :rules="rules")
      el-form-item
        el-input(
          type="number"
          min="0.00000001"
          step="0.00000001"
          v-model="price"
          clearable
          @change="fixPrice()"
          @input="priceChange()"
        )
          span(slot="prepend") PRICE
          span(slot="append") {{ base_token.symbol.name }}
      el-form-item
        el-input(
          type="number"
          v-model="amount"
          @input="amountChange(false, true)"
          @change="setPrecisions"
          clearable
        )
          span(slot="prepend") AMOUNT
          span(slot="append") {{ quote_token.symbol.name }}
      //- TODO Запилить свой компонент slider, так как на мобилках есть лаг, что подсказка не исчезает...
      el-slider.slider(
        :step="1"
        v-model="eosPercent"
        :marks="{0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%'}"
      )
      el-form-item(prop="total" :inline-message="true")
        el-input(
          type="number"
          v-model="total"
          @input="totalChange(false, true)"
          @change="setPrecisions"
        )
          span(slot="prepend") TOTAL
          span(slot="append") {{ base_token.symbol.name }}
    ButtonUi(
      :type="bid == 'buy' ? 'success' : 'danger'"
      @click.native="bid == 'buy' ? buy(trade) : sell(trade)"
    ) {{ bid }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { tradeMixin, tradeChangeEvents } from '~/mixins/trade'

import ButtonUi from '~/components/UI/Buttons/Button.vue'
import TabUi from '~/components/UI/Tabs/Tab.vue'
import SimpleTabUi from '~/components/UI/Tabs/SimpleTab.vue'
export default {
  props: ['type'],

  mixins: [tradeMixin, tradeChangeEvents],

  components: {
    ButtonUi,
    TabUi,
    SimpleTabUi
  },

=======
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
    //- Withdraw(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}" v-if="hasWithdraw")
    //- BOSIbc(:token="{contract: quote_token.contract, symbol: quote_token.symbol.name, precision: quote_token.symbol.precision}" v-if="quote_token.contract == 'bosibc.io'")
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'
import { trade } from '~/mixins/trade'

import FeeRate from '~/components/trade/FeeRate.vue'
import TabUi from '~/components/UI/Tabs/Tab.vue'
import SimpleTabUi from '~/components/UI/Tabs/SimpleTab.vue'
import LimitBid from '~/components/trade/LimitBid.vue'
import MarketBid from '~/components/trade/MarketBid.vue'
import ButtonUi from '~/components/UI/Buttons/Button.vue'
// import Withdraw from '~/components/withdraw/Withdraw'
export default {
  components: {
    FeeRate,
    TabUi,
    SimpleTabUi,
    LimitBid,
    MarketBid,
    ButtonUi,
    // Withdraw
  },

  mixins: [trade],

  props: ['type'],

>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
  data() {
    return {
      tabsBid: [
        { label: 'buy', color: 'aed581' },
        { label: 'sell', color: 'e57373' }
      ],
      tabsTrade: ['limit', 'market'],
<<<<<<< HEAD
=======
      arrCard: [],
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
      bid: 'buy',
      trade: 'limit'
    }
  },

<<<<<<< HEAD
  watch: {
    type(val) {
      this.bid = val
    }
  },

  computed: {
    ...mapState('market', ['quote_token', 'base_token']),
    ...mapGetters('market', ['tokenBalance', 'baseBalance'])
  },

  methods: {
    setAmount() {
      if (this.bid == 'buy') this.onSetAmount(parseFloat(this.baseBalance))
      if (this.bid == 'sell') this.onSetAmount(parseFloat(this.tokenBalance))
    },
    setBid(e) {
      this.bid = e
    },
    setTrade(e) {
      this.trade = e
    }
  },
=======
  computed: {
    ...mapState(['network']),
    ...mapState('chain', ['payForUser']),
    ...mapGetters('market', ['relatedPool', 'tokenBalance', 'baseBalance']),
    ...mapGetters(['user']),
    funPayForUser: {
      get() {
        return this.payForUser
      },
      set(val) {
        this.setPayForUser(val)
      }
    },
    // hasWithdraw() {
    //   return Object.keys(this.network.withdraw).includes(this.quote_token.str)
    // }
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
    ...mapMutations('chain', ['setPayForUser']),
    ...mapActions('market', ['fetchBuy', 'fetchSell']),
    ...mapActions('swap', ['setPair']),
    goToPool() {
      this.setPair(this.relatedPool.id)
      this.$router.push('/swap')
    },
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
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
}
</script>

<style lang="scss" scoped>
  .wrapper {
    display: grid;
<<<<<<< HEAD
    grid-gap: 10px;
    padding: 10px 15px;
    .balance {
      display: flex;
      justify-content: space-between;
=======
    grid-gap: 15px;
    align-content: baseline;
    @media (max-width: 1023px) {
      padding: 5px 10px;
    }
    .info {
      text-align: right;
      .free-cpu {
        display: block;
        margin: 5px;
      }
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
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
      p {
        margin: 0;
        text-transform: capitalize;
      }
    }
<<<<<<< HEAD
    .slider {
      margin-bottom: 25px;
      padding: 0 15px;
    }
=======
>>>>>>> 42e18c86f8aad1a3f552a58d2d4f67829af91f23
  }
</style>
