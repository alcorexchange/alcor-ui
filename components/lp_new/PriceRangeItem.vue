<template lang="pug">
  LPCard.price-range-item
    .name {{title}}
    input(placeholder="0" :value="value" @input="$emit('input', $event.target.value)")
    .desc {{pairs}}
    SSpacer
    .actions
        AlcorButton.decrease(round compact) -{{percentage}}%
        AlcorButton.increase(round compact) +{{percentage}}%
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
  props: ['title', 'pairs', 'percentage', 'value']
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
