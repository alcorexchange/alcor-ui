<template lang="pug">
.actions.d-flex.gap-8.align-items-center(v-if="this.$store.state.user")
  copy.pointer(@click="copyUserName" width="22" height="22" :color="color")
  user.pointer(@click="goToWallet" width="18" height="18" :color="color")
  users.pointer(@click="openAddFriendModal" width="22" height="22" :color="color")
</template>

<script>
import { mapActions } from 'vuex'
import Copy from '~/components/svg-icons/Copy.vue'
import User from '~/components/svg-icons/User.vue'
import Users from '~/components/svg-icons/Users.vue'

export default {
  components: { Copy, User, Users },
  computed: {
    color() {
      return this.$colorMode.preference !== 'dark' ? '#303133' : '#BDBDBD'
    }
  },
  methods: {
    ...mapActions('modal', ['addFriend']),
    goToWallet() {
      this.$router.push({ name: `wallet-friends___${this.$i18n.locale}` })
    },
    openAddFriendModal() {
      this.addFriend()
    },
    copyUserName() {
      navigator.clipboard.writeText(this.$store.state.user.name)
      this.$notify({
        title: 'Clipboard',
        message: 'Account name copyed to Clipboard',
        type: 'info'
      })
    }
  }
}
</script>
