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
    .slider {
      margin-bottom: 25px;
      padding: 0 15px;
    }
  }
</style>
