<template lang="pug">
  LPCard.price-range-item
    .name {{title}}
    input(placeholder="0" :value="value" @input="$emit('input', $event.target.value)")
    .desc {{description}}
    SSpacer
    .actions
        AlcorButton.decrease(@click="onPercentageChange({type: 'decrease'})" round compact) -{{percentage}}%
        AlcorButton.increase(@click="onPercentageChange({type: 'increase'})" round compact) +{{percentage}}%
</template>

<script>
import LPCard from '@/components/lp_new/LPCard.vue'
import AlcorButton from '@/components/AlcorButton.vue'
import Spacer from '@/components/Spacer.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'PriceRangeItem',
  components: {
    AlcorButton,
    Spacer,
    SSpacer,
    LPCard
  },
  props: [
    'title',
    'firstToken',
    'secondToken',
    'selectedRangeToken',
    'percentage',
    'value'
  ],
  computed: {
    description() {
      const first =
        this.selectedRangeToken === 'second'
          ? this.firstToken && this.firstToken.symbol
          : this.secondToken && this.secondToken.symbol
      const second =
        this.selectedRangeToken === 'second'
          ? this.secondToken && this.secondToken.symbol
          : this.firstToken && this.firstToken.symbol
      return `${first || ''} per ${second || ''}`
    }
  },
  methods: {
    onPercentageChange({ type }) {
      const amountToChange = parseFloat(this.value * this.percentage * 0.01)
      const increasedAmount = parseFloat(this.value) + amountToChange
      const decreaseAmount = parseFloat(this.value) - amountToChange
      this.$emit(
        'input',
        type === 'increase'
          ? increasedAmount.toFixed(2)
          : decreaseAmount.toFixed(2)
      )
      console.log({ increasedAmount, decreaseAmount, amountToChange })
    }
  }
}
</script>

<style scoped lang="scss">
.price-range-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  input {
    background: transparent;
    border: none;
    text-align: center;
    color: var(--text-default);
    font-size: 1.4rem;
    width: 100%;
  }
  .actions {
    display: flex;
    align-items: center;
    width: 100%;
    > * {
      font-size: 0.9rem !important;
      flex: 1;
    }
    .increase {
      margin-left: 4px;
    }
  }
}
</style>
