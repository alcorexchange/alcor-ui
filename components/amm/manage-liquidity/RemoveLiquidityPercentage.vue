<template lang="pug">
AlcorContainer(:alternative="true").mt-3.remove-liquidity-percentage
  .percentage.fs-24 100%
  el-slider(
    :step='1',
    :marks='{ 0: "0%", 25: "25%", 50: "50%", 75: "75%", 100: "100%" }'
    :show-tooltip="false"
  ).slider-buy.w-100.mb-2

  .d-flex.justify-content-between.mt-4
    .d-flex.align-items-center.gap-8
      token-image.token-image(src="token-conract" height="25")
      span WAX
    .d-flex.align-items-center.gap-8
      .fs-18 886
      .fs-14.color-action ($60.56)

  .d-flex.justify-content-between.mt-2
    .d-flex.align-items-center.gap-8
      token-image.token-image(src="token-conract" height="25")
      span WAX
    .d-flex.align-items-center.gap-8
      .fs-18 886
      .fs-14.color-action ($60.56)
</template>

<script>
import AlcorContainer from '~/components/AlcorContainer'
import TokenImage from '~/components/elements/TokenImage'
export default {
  components: {
    AlcorContainer,
    TokenImage
  }
}
</script>

<style lang="scss">
.percentage{
  font-weight: bold;
}
.slider-buy{
  padding: 0 18px;
}
</style>

