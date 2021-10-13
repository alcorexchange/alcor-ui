<template lang="pug">
LPCard
  .amount-and-token
    .token
      TokenImage.token-image(
        :src='$tokenLogo(token.symbol, token.contract)',
        height='24'
      )
      .name {{ token.symbol }}
    input(placeholder='0.0' :value="value" @input="$emit('input', $event.target.value)")
  SSpacer
  .details
    .left
      span Balance: 0 {{token.symbol}}
      AlcorButton(flat, compact) Max
    .right
      span ~ $999.6
</template>

<script>
import LPCard from '@/components/lp_new/LPCard.vue'
import AlcorButton from '@/components/AlcorButton.vue'
// import Spacer from '@/components/Spacer.vue'
import TokenImage from '@/components/elements/TokenImage.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'PriceRangeItem',
  components: {
    AlcorButton,
    // Spacer,
    TokenImage,
    SSpacer,
    LPCard
  },
  props: ['token', 'value']
}
</script>

<style scoped lang="scss">
.current-price {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.amount-and-token {
  display: flex;
  input {
    background: transparent;
    border: none;
    color: var(--text-default);
    font-size: 1.4rem;
    flex: 1;
    text-align: right;
  }
}
.token {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2);
  padding: 4px 8px;
}
.token-image {
  margin-right: 4px;
}
.details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .left {
    .alcor-button {
      font-size: 0.9rem;
      margin-left: 2px;
    }
  }
}
</style>
