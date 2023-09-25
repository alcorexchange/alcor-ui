<template lang="pug">
.farm-item-expand-simple
  .left
    .title.muted.fs-14.mb-1 Farmed Rewards
    .rewards
      .icon-and-value(v-for="x in 2")
        TokenImage(:src="$tokenLogo('WAX', 'eosio.token')" width="14px" height="14px")
        span 124.8340 WAX

  .actions
    AlcorButton(access).farm-claim-button Claim All
    AlcorButton(bordered access).farm-stake-button Stake All
    AlcorButton(bordered danger).farm-unstake-button UnStake All
</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import AlcorButton from '~/components/AlcorButton'
export default {
  name: 'FarmItemExpand',
  components: {
    TokenImage,
    AlcorButton,
  },
  props: ['farm'],
}
</script>

<style scoped lang="scss">
.farm-item-expand-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
