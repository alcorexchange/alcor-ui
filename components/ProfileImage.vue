<template lang="pug">
el-upload.profile-image-component(
  v-if="editable"
  action="https://alcor.exchange/api/upload/ipfs"
  :show-file-list="false"
  :on-success="handleAvatarSuccess"
)
  img.d-none(:src="src" @load="handleImageLoad")
  img.profile-image(v-if="src && loaded" :src="src" :style="{ width: size + 'px', height: size + 'px' }")
  vue-skeleton-loader.profile-image(
    v-else-if="src && !loaded"
    type="circle"
    :width='size',
    :height='size',
    animation='wave',
    wave-color='rgba(150, 150, 150, 0.1)',
  )
  account-avatar.profile-image(v-else :style="{ width: size + 'px', height: size + 'px' }")
.profile-image-component(v-else)
  img.d-none(:src="src" @load="handleImageLoad")
  img.profile-image(v-if="src && loaded" :src="src" :style="{ width: size + 'px', height: size + 'px' }")
  vue-skeleton-loader.profile-image(
    v-else-if="src && !loaded"
    type="circle"
    :width='size',
    :height='size',
    animation='wave',
    wave-color='rgba(150, 150, 150, 0.1)',
  )
  account-avatar.profile-image(v-else :style="{ width: size + 'px', height: size + 'px' }")

</template>

<script>
import VueSkeletonLoader from 'skeleton-loader-vue'
import AccountAvatar from '~/components/AccountAvatar.vue'

export default {
  components: { AccountAvatar, VueSkeletonLoader },
  props: {
    size: { type: Number, default: 40 },
    src: { type: String, default: '' },
    hash: { type: String, default: '' },
    editable: { type: Boolean, default: false }
  },
  data: () => ({ loaded: false }),
  methods: {
    handleImageLoad() {
      this.loaded = true
    },
    handleAvatarSuccess({ IpfsHash }) {
      this.$emit('update:hash', IpfsHash)
      this.$emit('update:src', `https://gateway.pinata.cloud/ipfs/${IpfsHash}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-image-component {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-image {
  border-radius: 50%;
}
</style>
