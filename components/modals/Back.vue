<template lang="pug">
.back-component.w-268
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-3
    i.el-icon-s-help
    span Back NFT
  .d-flex.gap-32
    .d-flex.flex-column.gap-32
      preview-card(:data="context.asset_id ? context : context.assets[0]" :ownerName="context.asset_id ? context.owner : context.assets[0].owner")
    .d-flex.flex-column.justify-content-between.w-100
      .d-flex.flex-column.gap-16
        .fs-14 Back NFT with tokens
        el-input.dark(v-model='waxAmount', size='small', placeholder='Amount of WAX')
        .color-danger.w-268 Once you back an NFT with tokens you can only free the tokens by burning the NFT!
      .d-flex.flex-column.gap-16
        alcor-button.color-danger(danger @click="backNft") Back NFT

</template>

<script>
import { mapState, mapActions } from 'vuex'
import PreviewCard from '~/components/cards/PreviewCard'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { PreviewCard, AlcorButton },
  data: () => ({
    waxAmount: null
  }),
  computed: {
    ...mapState('modal', ['context'])
  },
  methods: {
    ...mapActions('chain', ['back']),
    backNft() {
      this.back({ asset_id: this.context.asset_id, amount: (+this.waxAmount).toFixed(8) })
    }
  }
}
</script>

<style lang="scss" scoped>
.back-component .w-268 {
  width: 268px;
}

.el-input.dark .el-input__inner {
  background-color: var(--btn-active);
  border: 1px solid var(--btn-active);
}

</style>
