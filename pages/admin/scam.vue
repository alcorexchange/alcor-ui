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
    h1.mb-4 Scam Token Manager - {{ network.name }}

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
</template>

<script>
export default {
  layout: 'empty',

  data() {
    return {
      authenticated: false,
      password: '',
      authLoading: false,
      newContract: '',
      newToken: '',
      addingContract: false,
      addingToken: false,
      scamContracts: [],
      scamTokens: []
    }
  },

  computed: {
    network() {
      return this.$store.state.network
    }
  },

  methods: {
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
    }
  }
}
</script>

<style scoped>
.admin-scam-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  background: var(--background-color-base);
  min-height: 100vh;
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
