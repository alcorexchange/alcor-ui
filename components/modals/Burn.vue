<template lang="pug">
.burn-component.w-268
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-takeaway-box
    span Burn NFT
  .d-flex.gap-32
    .d-flex.flex-column.gap-32
      preview-card(:data="context.asset_id ? context : context.assets[0]" :ownerName="context.asset_id ? context.owner : context.assets[0].owner")
    .d-flex.flex-column.justify-content-between.w-100
      .d-flex.flex-column.gap-16
        .fs-18 What does this mean?
        .color-danger.w-268 Burning this NFT will destroy it permanently. This will unlock the backed tokens within your  NFT and the tokens will become transferable.

      .d-flex.flex-column.gap-16
        el-checkbox(
          v-model="confirmChecked"
          id="confirm"
        ) I understand and I wish to burn the NFT
        alcor-button.color-danger(danger :disabled="!confirmChecked" @click="burnNft") Burn NFT

</template>

<script>
import { mapState, mapActions } from 'vuex'
import PreviewCard from '~/components/cards/PreviewCard'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PreviewCard, AlcorButton },
  data: () => ({
    confirmChecked: false
  }),
  computed: {
    ...mapState('modal', ['context'])
  },
  methods: {
    ...mapActions('chain', ['burn']),
    burnNft() {
      this.burn(this.context.asset_id)
    },
  }
}
</script>

<style lang="scss" scoped>
.burn-component .w-268 {
  width: 268px;
}

</style>
