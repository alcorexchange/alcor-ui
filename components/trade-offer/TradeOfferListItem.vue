<template lang="pug">
#trade-offer-list-item-component.d-flex.flex-column.gap-8(@click="$emit('click')")
  .d-flex.gap-4
    el-checkbox.disable(
      v-model="offer.isSelected"
    )
      .fs-10 {{ date }}
  .d-flex.justify-content-between.align-items-center
    .d-flex.flex-column.gap-4
      .d-flex.gap-4
        .fs-14 {{ $store.state.user.name === offer.sender_name ? 'Sent to' : 'Receive from' }}
        .fs-14 {{ $store.state.user.name === offer.sender_name ? offer.recipient_name : offer.sender_name }}
      .status-tag(v-if="offer.state === 1") Invalid
    .d-flex.align-items-center.gap-24
      asset-deck(:deck="offer.sender_assets")
      i.el-icon-sort.r-45
      asset-deck(:deck="offer.recipient_assets")

</template>

<script>
import AssetDeck from '~/components/trading/AssetDeck.vue'

export default {
  components: { AssetDeck },
  props: ['offer'],
  computed: {
    date() {
      return new Date(+this.offer.created_at_time).toLocaleString()
    }
  }
}
</script>

<style lang="scss">
#trade-offer-list-item-component {
  padding: 16px 32px;
  cursor: pointer;
  border-radius: 5px;
  &:hover,
  &.active {
    background-color: var(--bg-alter-2);
  }

  .status-tag {
    background: hsla(0,100%,71%,.16);
    color: #ff6c6c;
    border-radius: 0.25rem;
    font-size: .625rem;
    font-weight: 600;
    height: 24px;
    padding: 6px 8px;
    text-align: center;
    width: fit-content;
  }

  .r-45 {
    transform: rotate(90deg);
  }
}
</style>
