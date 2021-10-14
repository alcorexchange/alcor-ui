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
      @click.native="bid == 'buy' ? buy(trade) : sell(trade)"
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
    ButtonUi,
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
    ...mapState('market', ['quote_token']),
    ...mapGetters('market', ['tokenBalance', 'baseBalance'])
  },

  watch: {
    type(val) {
      this.bid = val
    }
  },

  methods: {
    ...mapMutations('market', ['SET_AMOUNT_SELL']),
    ...mapActions('market', ['setBuyTotal']),
    setAmount() {
      // if (this.bid == 'buy') this.setBuyTotal(this.baseBalance)
      // if (this.bid == 'sell') this.SET_AMOUNT_SELL(this.tokenBalance)

      // TEST!!!
      if (this.bid == 'buy') this.setBuyTotal(3.09)
      else if (this.bid == 'sell') this.SET_AMOUNT_SELL(0.77)
      // if (this.bid == 'buy') this.onSetAmount(parseFloat(this.baseBalance))
      // if (this.bid == 'sell') this.onSetAmount(parseFloat(this.tokenBalance))
    },
    setBid(e) {
      this.bid = e
      this.$emit('setType', this.bid)
    },
    setTrade(e) {
      this.trade = e
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
