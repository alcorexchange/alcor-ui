<template lang="pug">
  .layout-search-accounts
    .empty(v-if="!search")
      span Search for accounts
    .accounts-list(v-else-if="accounts.length")
      div.item(v-for="account in accounts" tabindex="0" @click="handleAccountClick(account.scope)")
        span  {{ account.scope }}
        div.action.muted.fs-10
          span View-only Login
          i.el-icon-right

    .empty(v-else-if="!loading")
      span No accounts found!
    .empty-loading.empty(v-else)
      i.el-icon-loading
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'LayoutSearchAccounts',
  props: ['search'],
  data: () => ({
    accounts: [],
    loading: false,
  }),

  computed: {
    ...mapState(['user']),
  },

  watch: {
    search: {
      handler(s) {
        if (!s) {
          this.accounts = []
          return
        }
        this.getAccounts(s)
      },
      immediate: true,
    },
  },

  methods: {
    async getAccounts(search) {
      search = search?.toLowerCase() || ''

      // add z until length 12
      const lower_bound = search.padEnd(12, 'z')

      this.loading = true
      try {
        const { rows } = await this.$rpc.get_table_by_scope({
          code: 'eosio',
          limit: 10,
          lower_bound: search,
          upper_bound: lower_bound,
          table: 'userres',
        })

        this.accounts = rows
      } catch (e) {
        this.accounts = []
      } finally {
        this.loading = false
      }
    },

    async handleAccountClick(accountName) {
      if (this.user) {
        // already loggin in, logout
        await this.$store.dispatch('chain/logout')
      }
      this.$store.commit('setUser', { name: accountName, viewOnly: true })
      this.$store.dispatch('chain/afterLoginHook')

      // close the popover
      this.$emit('close')
    },
  },
}
</script>

<style scoped lang="scss">
.accounts-list {
  .item {
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s;
    .action {
      opacity: 0;
      transition: opacity 0.2s;
    }
    &:hover,
    &:focus-visible {
      background: var(--hover);
      .action {
        opacity: 0.8;
      }
    }
  }
}
.empty {
  padding: 40px 8px;
  text-align: center;
}
</style>
