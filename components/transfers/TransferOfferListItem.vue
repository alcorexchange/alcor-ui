<template lang="pug">
#transfer-offer-list-item-component.d-flex.flex-column.gap-8(@click="$emit('click')")
  .d-flex.gap-4.align-items-center
    el-checkbox.disable(
      v-if="!previewMode"
      v-model="offer.isSelected"
    )
    .fs-10 {{ date }}
  .d-flex.justify-content-between.align-items-center
    .d-flex.flex-column.gap-4
      .d-flex.gap-4
        .fs-14 {{ $store.state.user.name === offer.sender_name ? 'Sent to' : 'Receive from' }}
        .fs-14 {{ $store.state.user.name === offer.sender_name ? offer.recipient_name : offer.sender_name }}
      .status-tag(v-if="offer.sender_name == $store.state.user.name") Sent
      .status-tag.receive(v-else) Receive
    .d-flex.align-items-center.gap-24
      asset-deck(:deck="offer.assets")

</template>

<script>
import AssetDeck from '~/components/trading/AssetDeck.vue'

export default {
  components: { AssetDeck },
  props: ['offer', 'previewMode'],
  computed: {
    date() {
      return new Date(+this.offer.created_at_time).toLocaleString()
    }
  }
}
</script>

<style lang="scss">
#transfer-offer-list-item-component {
  padding: 16px 32px;
  cursor: pointer;
  border-radius: 5px;
  &:hover,
  &.active {
    background-color: var(--bg-alter-2);
  }

  .status-tag {
    background: rgba(112, 142, 248, 0.16);
    color: #708ef8;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    height: 24px;
    padding: 6px 8px;
    text-align: center;
    width: fit-content;
    &.receive {
      background: rgba(255, 183, 21, 0.16);
      color: #ffb715;
    }

  }

  .r-45 {
    transform: rotate(90deg);
  }
}
</style>
