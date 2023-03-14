<template lang="pug">
.auth-only
  template(v-if="$store.state.user")
    slot
  .d-flex.justify-content-center(v-else)
    AlcorButton.connect(type="default" @click='$store.dispatch("chain/mainLogin")') {{ $t('Connect Wallet') }}
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  components: {
    AlcorButton
  }
}
</script>

<style scoped lang="scss">
.connect{
  width: 100%;
  padding: 16px;
  border-radius: 6px;
}
</style>
