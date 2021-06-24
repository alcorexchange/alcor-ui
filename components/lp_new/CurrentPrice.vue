<template lang="pug">
  LPCard.current-price
    .name Current Price
    .price {{price}}
    .desc USDT per ETH
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
  props: ['pairs', 'price']
}
</script>

<style scoped lang="scss">
.current-price {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.price {
  color: var(--text-default);
  font-size: 1.4rem;
  width: 100%;
  text-align: center;
}
</style>
