<template lang="pug">
#gift-links-list-item-component.d-flex.flex-column.gap-8(@click="$emit('click')")
  .d-flex.gap-8.align-items-center
    el-checkbox.disable(
      v-if="!previewMode"
      v-model="link.isSelected"
    )
    .fs-10 {{ date }}
  .d-flex.justify-content-between.align-items-center
    .d-flex.flex-column.gap-4
      .d-flex.gap-4
        .fs-14 Created By
        .fs-14 {{ link.creator }}
      .d-flex.gap-4.fs-12
        span Link ID
        span {{'#'+link.link_id}}
      .status-tag Created
    .d-flex.align-items-center.gap-24
      asset-deck(:deck="link.assets")

</template>

<script>
import AssetDeck from '~/components/trading/AssetDeck.vue'

export default {
  components: { AssetDeck },
  props: ['link', 'previewMode'],
  computed: {
    date() {
      return new Date(+this.link.created_at_time).toLocaleString()
    }
  }
}
</script>

<style lang="scss">
#gift-links-list-item-component {
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
  }

  .r-45 {
    transform: rotate(90deg);
  }
}
</style>
