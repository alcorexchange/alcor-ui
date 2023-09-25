<template lang="pug">
.farm-item-expand
  .left
    .title.muted.fs-14.mb-1 Farmed Rewards
    .rewards
      .icon-and-value(v-for="x in 2")
        TokenImage(:src="$tokenLogo('WAX', 'eosio.token')" width="14px" height="14px")
        span 124.8340 WAX

  .actions
    AlcorButton(access).claim-button Claim All
    AlcorButton(bordered access).stake-button Stake All
    AlcorButton(bordered danger).unstake-button UnStake All
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
.farm-item-expand {
  background: var(--hover);
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.stake-button {
  color: var(--main-action-green) !important;
  &:hover {
    background: var(--main-action-green) !important;
    color: black !important;
  }
}
.unstake-button {
  color: var(--main-action-red);
  &:hover {
    background: var(--main-action-red) !important;
    color: black !important;
  }
}
.claim-button {
  color: var(--text-theme) !important;
  &:hover {
    background: var(--main-green) !important;
  }
}
</style>
