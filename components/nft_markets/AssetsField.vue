<template lang="pug">
.asset-field-component
  normal-card.active-border.pointer(v-for="asset in assets" :data='asset', :key="asset.asset_id", @click="remove(asset)", mode="preview" :small="assets.length > 1")

</template>

<script>
import NormalCard from '~/components/nft_markets/NormalCard'

export default {
  components: { NormalCard },
  props: ['assets'],
  mounted() {
  },
  methods: {
    remove(asset) {
      this.$emit('removeAsset', asset)
    }
  }
}
</script>

<style lang="scss">
.asset-field-component {
  width: 450px;
  height: 420px;
  border-radius: 8px;
  border: 1px solid var(--main-green);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  overflow: scroll;
  gap: 16px;
  padding: 32px;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

}
</style>
