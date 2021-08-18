<template lang="pug">
.resources-page
  .resources-container
    .resource-item-container
      ResourceItem
    .resource-item-container
      ResourceItem
    .resource-item-container
      ResourceItem
  .rewards-and-actions
    .rewards-card
      RewardsCard
    .actions-container
      .action-item
        StakeAction(:isStake="true")
      .action-item
        StakeAction
  SSpacer(:high="true")
  Validators
</div>
</template>

<script>
// import { mapGetters, mapState } from 'vuex'
import ResourceItem from '@/components/wallet/ResourceItem.vue'
import RewardsCard from '@/components/wallet/RewardsCard.vue'
import StakeAction from '@/components/wallet/StakeAction.vue'
import Validators from '@/components/wallet/Validators.vue'
import SSpacer from '@/components/SSpacer.vue'
export default {
  name: 'NFTs',
  components: {
    ResourceItem,
    RewardsCard,
    StakeAction,
    Validators,
    SSpacer
  },
  data: () => ({
    search: '',
  }),
  computed: {},
}
</script>

<style scoped lang="scss">
.resources-container, .rewards-and-actions, .actions-container{
  display: flex;
  flex-wrap: wrap;
}
.resource-item-container{
  padding: 20px;
  flex: 1;
  &:first-child {
    padding-left: 0;
  }
  &:last-child {
    padding-right: 0;
  }
}
.rewards-card{
  width: 33.3333%;
}
.actions-container{
  flex: 1;
}
.action-item{
  width: 50%;
}
.rewards-card{
  padding: 20px;
  padding-left: 0;
}
.action-item{
  padding: 20px;
  &:last-child {
    padding-right: 0;
  }
}
</style>
