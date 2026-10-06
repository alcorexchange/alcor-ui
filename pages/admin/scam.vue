<template lang="pug">
.admin-scam-page
  .auth-form(v-if="!authenticated")
    h2.mb-4 Moderator Login
    el-input(
      v-model="password"
      type="password"
      placeholder="Enter password"
      @keyup.enter.native="authenticate"
    ).mb-3
    el-button(type="primary" @click="authenticate" :loading="authLoading") Login

  .scam-manager(v-else)
    h1.mb-4 ☠️ Scam Hunter - {{ network.name }}

    el-tabs(:value="activeTab" @tab-click="onTabClick")
      el-tab-pane(label="UI Bans" name="ui")
        .section.mb-5
          h3.mb-3 Scam Contracts
          .add-form.mb-3
            el-input(v-model="newContract" placeholder="contract name" @keyup.enter.native="addContract").mr-2
            el-button(type="primary" @click="addContract" :loading="addingContract") Add

          el-table(:data="scamContracts" border style="width: 100%")
            el-table-column(prop="value" label="Contract")
            el-table-column(label="Actions" width="120")
              template(slot-scope="scope")
                el-button(
                  type="danger"
                  size="mini"
                  @click="removeContract(scope.row.value)"
                ) Remove

        .section
          h3.mb-3 Scam Tokens
          .add-form.mb-3
            el-input(v-model="newToken" placeholder="symbol-contract" @keyup.enter.native="addToken").mr-2
            el-button(type="primary" @click="addToken" :loading="addingToken") Add

          el-table(:data="scamTokens" border style="width: 100%")
            el-table-column(prop="value" label="Token ID (symbol-contract)")
            el-table-column(label="Actions" width="120")
              template(slot-scope="scope")
                el-button(
                  type="danger"
                  size="mini"
                  @click="removeToken(scope.row.value)"
                ) Remove

      el-tab-pane(label="Contract Bans (DEX)" name="dex")
        .section
          .info-text.mb-2 Accounts banned on-chain in {{ network.contract }} ({{ filteredDexBans.length }} accounts)
          .add-form.mb-3
            el-input(v-model="newBannedAccount" placeholder="account name" @keyup.enter.native="addBannedAccount").mr-2
            el-button(type="primary" @click="addBannedAccount" :loading="addingBannedAccount" :disabled="!user") Ban Account
          .warning-text.mb-3(v-if="!user") Connect wallet with contract authority to add bans

          el-input.mb-3(v-model="dexSearch" placeholder="Search accounts..." prefix-icon="el-icon-search" clearable)

          el-table(:data="filteredDexBans" border style="width: 100%" v-loading="loadingContractBans")
            el-table-column(prop="value" label="Banned Account")
            el-table-column(label="Actions" width="120")
              template(slot-scope="scope")
                el-button.unban-btn(
                  size="mini"
                  @click="removeDexBan(scope.row.value)"
                  :disabled="!user"
                ) Unban

      el-tab-pane(label="Contract Bans (Swap)" name="swap")
        .section
          .info-text.mb-2 Accounts banned on-chain in {{ network.amm.contract }} ({{ filteredSwapBans.length }} accounts)
          .add-form.mb-3
            el-input(v-model="newSwapBannedAccount" placeholder="account name" @keyup.enter.native="addSwapBannedAccount").mr-2
            el-button(type="primary" @click="addSwapBannedAccount" :loading="addingSwapBannedAccount" :disabled="!user") Ban Account
          .warning-text.mb-3(v-if="!user") Connect wallet with contract authority to add bans

          el-input.mb-3(v-model="swapSearch" placeholder="Search accounts..." prefix-icon="el-icon-search" clearable)

          el-table(:data="filteredSwapBans" border style="width: 100%" v-loading="loadingSwapBans")
            el-table-column(prop="value" label="Banned Account")
            el-table-column(label="Actions" width="120")
              template(slot-scope="scope")
                el-button.unban-btn(
                  size="mini"
                  @click="removeSwapBan(scope.row.value)"
                  :disabled="!user"
                ) Unban

      el-tab-pane(label="Contract Bans (OTC)" name="otc")
        .section
          .info-text.mb-2 Accounts banned on-chain in {{ network.otc.contract }} ({{ filteredOtcBans.length }} accounts)
          .add-form.mb-3
            el-input(v-model="newOtcBannedAccount" placeholder="account name" @keyup.enter.native="addOtcBannedAccount").mr-2
            el-button(type="primary" @click="addOtcBannedAccount" :loading="addingOtcBannedAccount" :disabled="!user") Ban Account
          .warning-text.mb-3(v-if="!user") Connect wallet with contract authority to add bans

          el-input.mb-3(v-model="otcSearch" placeholder="Search accounts..." prefix-icon="el-icon-search" clearable)

          el-table(:data="filteredOtcBans" border style="width: 100%" v-loading="loadingOtcBans")
            el-table-column(prop="value" label="Banned Account")
            el-table-column(label="Actions" width="120")
              template(slot-scope="scope")
                el-button.unban-btn(
                  size="mini"
                  @click="removeOtcBan(scope.row.value)"
                  :disabled="!user"
                ) Unban
</template>

<script>
export default {
  layout: 'admin',

  data() {
    return {
      authenticated: process.env.NODE_ENV === 'development',
      password: '',
      authLoading: false,
      newContract: '',
      newToken: '',
      newBannedAccount: '',
      newSwapBannedAccount: '',
      newOtcBannedAccount: '',
      addingContract: false,
      addingToken: false,
      addingBannedAccount: false,
      addingSwapBannedAccount: false,
      addingOtcBannedAccount: false,
      loadingContractBans: false,
      loadingSwapBans: false,
      loadingOtcBans: false,
      scamContracts: [],
      scamTokens: [],
      contractBannedAccounts: [],
      swapBannedAccounts: [],
      otcBannedAccounts: [],
      dexSearch: '',
      swapSearch: '',
      otcSearch: ''
    }
  },

  computed: {
    network() {
      return this.$store.state.network
    },
    user() {
      return this.$store.state.user
    },
    activeTab() {
      const tab = this.$route.query.tab
      return ['ui', 'dex', 'swap', 'otc'].includes(tab) ? tab : 'ui'
    },
    filteredDexBans() {
      if (!this.dexSearch) return this.contractBannedAccounts
      const search = this.dexSearch.toLowerCase()
      return this.contractBannedAccounts.filter(acc => acc.value.toLowerCase().includes(search))
    },
    filteredSwapBans() {
      if (!this.swapSearch) return this.swapBannedAccounts
      const search = this.swapSearch.toLowerCase()
      return this.swapBannedAccounts.filter(acc => acc.value.toLowerCase().includes(search))
    },
    filteredOtcBans() {
      if (!this.otcSearch) return this.otcBannedAccounts
      const search = this.otcSearch.toLowerCase()
      return this.otcBannedAccounts.filter(acc => acc.value.toLowerCase().includes(search))
    }
  },

  mounted() {
    this.loadContractBans()
    this.loadSwapBans()
    this.loadOtcBans()
  },

  methods: {
    onTabClick(tab) {
      this.$router.push({ query: { tab: tab.name } })
    },

    async authenticate() {
      if (!this.password) return

      this.authLoading = true
      this.$axios.defaults.headers.common['x-admin-password'] = this.password

      try {
        await this.loadScamLists()
        this.authenticated = true
      } catch (e) {
        const message = e.response?.data?.error || 'Invalid password'
        this.$notify.error({ title: 'Authentication failed', message })
        delete this.$axios.defaults.headers.common['x-admin-password']
      } finally {
        this.authLoading = false
      }
    },

    async loadScamLists() {
      const { data } = await this.$axios.get('/v2/admin/scam')
      this.scamContracts = data.scam_contracts.map(v => ({ value: v }))
      this.scamTokens = data.scam_tokens.map(v => ({ value: v }))
    },

    async addContract() {
      if (!this.newContract.trim()) return

      this.addingContract = true
      try {
        await this.$axios.post('/v2/admin/scam', {
          type: 'contract',
          value: this.newContract.trim()
        })
        this.newContract = ''
        await this.loadScamLists()
        this.$notify.success({ title: 'Contract added' })
      } catch (e) {
        this.$notify.error({ title: 'Failed to add contract' })
      } finally {
        this.addingContract = false
      }
    },

    async addToken() {
      if (!this.newToken.trim()) return

      this.addingToken = true
      try {
        await this.$axios.post('/v2/admin/scam', {
          type: 'token',
          value: this.newToken.trim()
        })
        this.newToken = ''
        await this.loadScamLists()
        this.$notify.success({ title: 'Token added' })
      } catch (e) {
        this.$notify.error({ title: 'Failed to add token' })
      } finally {
        this.addingToken = false
      }
    },

    async removeContract(value) {
      try {
        await this.$axios.delete('/v2/admin/scam', {
          data: { type: 'contract', value }
        })
        await this.loadScamLists()
        this.$notify.success({ title: 'Contract removed' })
      } catch (e) {
        this.$notify.error({ title: 'Failed to remove contract' })
      }
    },

    async removeToken(value) {
      try {
        await this.$axios.delete('/v2/admin/scam', {
          data: { type: 'token', value }
        })
        await this.loadScamLists()
        this.$notify.success({ title: 'Token removed' })
      } catch (e) {
        this.$notify.error({ title: 'Failed to remove token' })
      }
    },

    async loadContractBans() {
      this.loadingContractBans = true
      try {
        const { rows } = await this.$rpc.get_table_rows({
          code: this.network.contract,
          scope: this.network.contract,
          table: 'ban',
          limit: 1,
          json: true
        })

        if (rows.length > 0 && rows[0].accounts) {
          this.contractBannedAccounts = rows[0].accounts.map(acc => ({ value: acc }))
        } else {
          this.contractBannedAccounts = []
        }
      } catch (e) {
        console.error('Failed to load contract bans:', e)
        this.contractBannedAccounts = []
      } finally {
        this.loadingContractBans = false
      }
    },

    async addBannedAccount() {
      const account = this.newBannedAccount.trim().toLowerCase()
      if (!account) return
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      this.addingBannedAccount = true
      try {
        const actions = [{
          account: this.network.contract,
          name: 'ban',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { acc: account }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        this.newBannedAccount = ''
        await this.loadContractBans()
        this.$notify.success({ title: 'Account banned on contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to ban account', message })
      } finally {
        this.addingBannedAccount = false
      }
    },

    async removeDexBan(account) {
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      try {
        const actions = [{
          account: this.network.contract,
          name: 'unban',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { acc: account }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        await this.loadContractBans()
        this.$notify.success({ title: 'Account unbanned from DEX contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to unban account', message })
      }
    },

    async loadSwapBans() {
      this.loadingSwapBans = true
      try {
        const { rows } = await this.$rpc.get_table_rows({
          code: this.network.amm.contract,
          scope: this.network.amm.contract,
          table: 'banlist',
          limit: 1000,
          json: true
        })

        this.swapBannedAccounts = rows.map(row => ({ value: row.account }))
      } catch (e) {
        console.error('Failed to load swap bans:', e)
        this.swapBannedAccounts = []
      } finally {
        this.loadingSwapBans = false
      }
    },

    async addSwapBannedAccount() {
      const account = this.newSwapBannedAccount.trim().toLowerCase()
      if (!account) return
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      this.addingSwapBannedAccount = true
      try {
        const actions = [{
          account: this.network.amm.contract,
          name: 'banacc',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { acc: account, isBan: true }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        this.newSwapBannedAccount = ''
        await this.loadSwapBans()
        this.$notify.success({ title: 'Account banned on swap contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to ban account', message })
      } finally {
        this.addingSwapBannedAccount = false
      }
    },

    async removeSwapBan(account) {
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      try {
        const actions = [{
          account: this.network.amm.contract,
          name: 'banacc',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { acc: account, isBan: false }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        await this.loadSwapBans()
        this.$notify.success({ title: 'Account unbanned from swap contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to unban account', message })
      }
    },

    async loadOtcBans() {
      this.loadingOtcBans = true
      try {
        const { rows } = await this.$rpc.get_table_rows({
          code: this.network.otc.contract,
          scope: this.network.otc.contract,
          table: 'banned',
          limit: 1000,
          json: true
        })

        this.otcBannedAccounts = rows.map(row => ({ value: row.account }))
      } catch (e) {
        console.error('Failed to load OTC bans:', e)
        this.otcBannedAccounts = []
      } finally {
        this.loadingOtcBans = false
      }
    },

    async addOtcBannedAccount() {
      const account = this.newOtcBannedAccount.trim().toLowerCase()
      if (!account) return
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      this.addingOtcBannedAccount = true
      try {
        const actions = [{
          account: this.network.otc.contract,
          name: 'ban',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { account }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        this.newOtcBannedAccount = ''
        await this.loadOtcBans()
        this.$notify.success({ title: 'Account banned on OTC contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to ban account', message })
      } finally {
        this.addingOtcBannedAccount = false
      }
    },

    async removeOtcBan(account) {
      if (!this.user) {
        this.$notify.error({ title: 'Wallet not connected' })
        return
      }

      try {
        const actions = [{
          account: this.network.otc.contract,
          name: 'unban',
          authorization: [{ actor: this.user.name, permission: 'active' }],
          data: { account }
        }]

        await this.$store.dispatch('chain/sendTransaction', actions)
        await this.loadOtcBans()
        this.$notify.success({ title: 'Account unbanned from OTC contract' })
      } catch (e) {
        const message = e.message || 'Transaction failed'
        this.$notify.error({ title: 'Failed to unban account', message })
      }
    }
  }
}
</script>

<style scoped>
.admin-scam-page {
  max-width: 800px;
  margin: 0 auto;
}


.auth-form {
  max-width: 300px;
  margin: 100px auto;
  text-align: center;
}

.add-form {
  display: flex;
  gap: 10px;
}

.add-form .el-input {
  flex: 1;
}

.info-text {
  color: #909399;
  font-size: 13px;
}

.warning-text {
  color: #e6a23c;
  font-size: 13px;
}

.unban-btn {
  background: transparent !important;
  border-color: #606266 !important;
  color: #909399 !important;
}

.unban-btn:hover {
  border-color: #909399 !important;
  color: #c0c4cc !important;
}
</style>

<style>
.admin-scam-page .el-input__inner {
  border: 1px solid #606266 !important;
  background: var(--background-color-secondary) !important;
}

.admin-scam-page .el-input__inner:focus {
  border-color: #409eff !important;
}
</style>
