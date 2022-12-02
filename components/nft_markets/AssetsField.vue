<template lang="pug">
.asset-field-component
  preview-card.active-border.pointer(v-if="assets.length" v-for="asset in assets" :data='asset', :key="asset", @click="remove(asset)", :small="smallCards || assets.length > 1")

</template>

<script>
import PreviewCard from '~/components/cards/PreviewCard'

export default {
  components: { PreviewCard },
  props: ['assets', 'smallCards'],
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
