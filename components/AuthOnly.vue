<template lang="pug">
.auth-only
  template(v-if="$store.state.user")
    slot
  alcor-button.w-100(v-else access) Connect Wallet
</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton }
}
</script>
