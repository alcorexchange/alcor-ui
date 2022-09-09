<template lang="pug">
.block-user-component
  .title.fs-18.fw-bold.d-flex.align-items-center.gap-10.mb-4
    img(src='~/assets/icons/SmileyXEyes.svg')
    span Block
  .d-flex.flex-column.gap-16
    span.fs-14.fw-bold.red Are you sure you want to block?
    profile-image.account-image(:src="context.imgSrc" :size="128")
    span.fs-22.fw-bold.d-flex.justify-content-center {{ context.name }}
    alcor-button.w-100.red(@click="block") Block

</template>

<script>
import { mapState, mapActions } from 'vuex'
import ProfileImage from '~/components/ProfileImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { ProfileImage, AlcorButton },
  computed: {
    ...mapState('modal', ['context'])
  },
  methods: {
    ...mapActions('social', ['blockUser']),
    block() {
      this.blockUser(this.context.name)
        .then(() => this.$router.go(0))
    }
  }
}
</script>

