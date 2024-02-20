<template lang="pug">
#asset-deck-component
  .deck(v-if="!deck.length")
    .deck-card 0
  .deck(v-else)
    asset-card-image.deck-card(:template="deck[0].template.immutable_data")
    asset-card-image.deck-card.offset-1(v-if="deck[1]" :template="deck[1].template.immutable_data")
    .deck-card.aditional.offset-2(v-if="deck.length > 2" :template="deck[1].template.immutable_data") +{{ deck.length - 2 }}

    //pre {{ deck[0].template.immutable_data.img }}
</template>

<script>
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'

export default {
  components: { AssetCardImage },
  props: ['deck']
}
</script>

<style lang="scss" scoped>
.deck {
  position: relative;

  &-card {
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--border-1);
    border-radius: 0.25rem;
    height: 48px;
    width: 32px;
    background: var(--background-color-base);

    &.aditional {
      background: var(--bg-alter-2);
    }

    &.offset-1 {
      position: absolute;
      left: 5px;
      top: 3px;
    }

    &.offset-2 {
      position: absolute;
      left: 10px;
      top: 6px;
    }

  }
}
</style>
