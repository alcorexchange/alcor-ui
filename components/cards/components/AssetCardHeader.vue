<template lang="pug">
.d-flex.justify-content-between.align-items-center
  .d-flex.align-items-center.gap-8
    profile-image(
      :src="`https://profile.api.atomichub.io/v1/profiles/chain/wax-mainnet/account/${ownerName}/avatar`"
      :size="20"
    )
    .fs-12 {{ ownerName }}
  .d-flex.align-items-center.gap-8
    img(src='~/assets/images/double_arrow.svg', alt='double_arrow')
    img(src='~/assets/images/fire.svg', alt='fire')
    .card_number.d-flex.align-items-center.ml-1.fs-12 {{ "#" + mint }}

</template>

<script>
import ProfileImage from '~/components/ProfileImage.vue'

export default {
  components: { ProfileImage },
  props: ['data', 'ownerName'],
  computed: {
    mint() {
      return this.data.template_mint.length > 4 ? this.data.template_mint.substr(0, 1) + '...' + this.data.template_mint.substr(-3) : this.data.template_mint
    }
  }
}
</script>

<style lang="scss" scoped>
.card_number {
  padding: 0 3px;
  border-radius: 3px;
  height: 22px;
  background-color: var(--card-number);
}
</style>
