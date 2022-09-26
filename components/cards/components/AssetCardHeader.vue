<template lang="pug">
.d-flex.justify-content-between.align-items-center
  .d-flex.align-items-center.gap-8
    profile-image(:src="ownerImgSrc" :size="22")
    span {{ data.owner }}
  .d-flex.align-items-center.gap-8
    img(src='~/assets/images/double_arrow.svg', alt='double_arrow')
    img(src='~/assets/images/fire.svg', alt='fire')
    .card_number.d-flex.align-items-center.ml-1 {{ "#" + data.template_mint }}

</template>

<script>
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { ProfileImage },
  props: ['data', 'ownerImgSrc']
}
</script>

<style lang="scss">
.card_number {
  padding: 0 3px;
  border-radius: 3px;
  height: 22px;
  background-color: var(--card-number);
}
</style>
