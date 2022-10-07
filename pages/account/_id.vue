<template lang="pug">
#account-id-layout.d-flex.flex-column.gap-16.mt-4
  account-header
  main.account-main
    nuxt-child

</template>

<script>
import AccountHeader from '~/components/account/AccountHeader.vue'

export default {
  components: { AccountHeader }
}
</script>
