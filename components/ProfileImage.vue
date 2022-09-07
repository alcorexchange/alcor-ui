<template lang="pug">
el-upload.profile-image-component(
  v-if="editable"
  action="https://alcor.exchange/api/upload/ipfs"
  :show-file-list="false"
  :on-success="handleAvatarSuccess"
)
  img.profile-image(v-if="src" :src="src")
  account-avatar.profile-image(v-else)
.profile-image-component(v-else)
  img.profile-image(v-if="src" :src="src")
  account-avatar.profile-image(v-else)

</template>

<script>
import AccountAvatar from '~/components/AccountAvatar.vue'

export default {
  components: { AccountAvatar },
  props: {
    src: { type: String, default: '' },
    hash: { type: String, default: '' },
    editable: { type: Boolean, default: false }
  },
  methods: {
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
}
.profile-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
</style>
