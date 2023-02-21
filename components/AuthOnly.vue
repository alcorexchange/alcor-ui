<template lang="pug">
.auth-only
  template(v-if="$store.state.user")
    slot
  .d-flex.justify-content-center(v-else)
    el-button(type="default" @click='$store.dispatch("chain/mainLogin")') {{ $t('Connect Wallet') }}
</template>
