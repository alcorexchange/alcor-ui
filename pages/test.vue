<template lang="pug">
  alcor-container
    el-button(@click="test") Test
    el-button(@click="openCreatePoolModal") Create Pool

    hr

    .token-input
      el-input(placeholder="amount" v-model="input" type="text")
        template(slot="append")
          select-token(:tokens="tokens" @selected="setToken")

    hr

    | range..
    hr

    //RangeSelector(
      v-if="pool"
      currencyA="baseCurrency || undefined"
      currencyB="quoteCurrency || undefined"
      feeAmount="feeAmount}"
      ticksAtLimit="ticksAtLimit"
      price="price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined"
      priceLower="priceLower"
      priceUpper="priceUpper"
      onLeftRangeInput="onLeftRangeInput"
      onRightRangeInput="onRightRangeInput"
      interactive="!hasExistingPosition")


</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

import SelectToken from '~/components/modals/amm/SelectToken'
import AlcorContainer from '~/components/AlcorContainer'
import TokenImage from '~/components/elements/TokenImage'

export default {
  layout: 'test',
  components: { AlcorContainer, TokenImage, SelectToken },

  data: () => {
    return {
      input: ''
    }
  },

  computed: {
    ...mapState(['user', 'network']),

    tokens() {
      return this.user?.balances || []
    },

    //ticksAtLimit() {
    //  return {
    //    [Bound.LOWER]: feeAmount && tickLower === tickSpaceLimits.LOWER,
    //    [Bound.UPPER]: feeAmount && tickUpper === tickSpaceLimits.UPPER,
    //  }
    //}
  },

  created() {
    //this.$store.dispatch('amm/placePosition')
  },

  methods: {
    ...mapActions('modal', ['createPool', 'assets']),

    setToken(token) {
      console.log('selected token', token)
    },

    openCreatePoolModal() {
      this.createPool()
    },

    async test() {
      //this.$store.dispatch('amm/init')
      this.$store.dispatch('amm/test')
      //console.log('R', r)
    }
  }
}

</script>

<style lang="scss">
.token-input {
  width: 300px;

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: white;
    }
  }

  .el-input__inner {
    height: 50px;
  }

  .el-input-group__append {
    //display: flex;
  }

  .el-button {
    border: 1px solid;
    //padding: 5px 5px;
  }

  input {
    background-color: var(--selector-bg);;
  }
}
</style>
