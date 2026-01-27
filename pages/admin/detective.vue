<template lang="pug">
.detective-page
  .auth-form(v-if="!authenticated")
    h2.mb-4 Moderator Login
    el-input(
      v-model="password"
      type="password"
      placeholder="Enter password"
      @keyup.enter.native="authenticate"
    ).mb-3
    el-button(type="primary" @click="authenticate" :loading="authLoading") Login

  .detective-manager(v-else)
    h1.mb-4 Detective - {{ network.name }}

    el-tabs(v-model="activeTab")
      el-tab-pane(label="Account Report" name="account")
        .section
          .search-form.mb-4
            el-input(
              v-model="accountName"
              placeholder="account name"
              @keyup.enter.native="searchAccount"
            ).mr-2
            el-button(type="primary" @click="searchAccount" :loading="searchingAccount") Search

          .report-results(v-if="accountReport")
            h3.mb-3 Account: {{ accountReport.account }}

            .result-section.mb-3(v-if="accountReport.ips && accountReport.ips.length")
              h4 IPs ({{ accountReport.ips.length }})
              el-collapse
                el-collapse-item(title="Show IPs")
                  ul
                    li(v-for="ip in accountReport.ips" :key="ip") {{ ip }}

            .result-section.mb-3(v-if="accountReport.relatedAccounts && accountReport.relatedAccounts.length")
              h4 Related Accounts ({{ accountReport.relatedAccounts.length }})
              el-collapse
                el-collapse-item(title="Show Accounts")
                  ul
                    li(v-for="acc in accountReport.relatedAccounts" :key="acc") {{ acc }}

            .result-section(v-if="accountReport.summary")
              h4 Summary
              pre.summary-text {{ accountReport.summary }}

          .no-results(v-else-if="searchedAccount && !searchingAccount")
            | No results found

      el-tab-pane(label="CEX Lookup" name="cex")
        .section
          .search-form.mb-4
            el-input(
              v-model="memo"
              placeholder="CEX deposit memo (e.g., 00443a4b1950cb26)"
              @keyup.enter.native="searchCex"
            ).mr-2
            el-input(
              v-model="cexAccount"
              placeholder="From account (optional)"
              @keyup.enter.native="searchCex"
            ).account-input.mr-2
            el-input-number(
              v-model="cexLimit"
              :min="1"
              :max="1000"
              placeholder="Limit"
            ).limit-input.mr-2
            el-date-picker(
              v-model="dateRange"
              type="daterange"
              range-separator="to"
              start-placeholder="From"
              end-placeholder="To"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-ddTHH:mm:ss"
            ).mr-2
            el-button(type="primary" @click="searchCex" :loading="searchingCex") Search

          .cex-results(v-if="cexResults.length")
            .info-text.mb-2 Found {{ cexTotal }} transfers
            el-table(:data="cexResults" border style="width: 100%")
              el-table-column(prop="timestamp" label="Time" width="180")
                template(slot-scope="scope")
                  | {{ formatDate(scope.row.timestamp) }}
              el-table-column(prop="from" label="From" width="140")
                template(slot-scope="scope")
                  | {{ scope.row.act?.data?.from || '-' }}
              el-table-column(prop="to" label="To" width="140")
                template(slot-scope="scope")
                  | {{ scope.row.act?.data?.to || '-' }}
              el-table-column(prop="quantity" label="Quantity" width="160")
                template(slot-scope="scope")
                  | {{ scope.row.act?.data?.quantity || '-' }}
              el-table-column(prop="memo" label="Memo")
                template(slot-scope="scope")
                  | {{ scope.row.act?.data?.memo || '-' }}

          .no-results(v-else-if="searchedCex && !searchingCex")
            | No transfers found
</template>

<script>
export default {
  layout: 'admin',

  data() {
    return {
      authenticated: process.env.NODE_ENV === 'development',
      password: '',
      authLoading: false,
      activeTab: 'account',

      // Account Report
      accountName: '',
      accountReport: null,
      searchingAccount: false,
      searchedAccount: false,

      // CEX Lookup
      memo: '',
      cexAccount: '',
      cexLimit: 100,
      dateRange: null,
      cexResults: [],
      cexTotal: 0,
      searchingCex: false,
      searchedCex: false
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
        // Test auth with a simple request
        await this.$axios.get('/v2/admin/scam')
        this.authenticated = true
      } catch (e) {
        const message = e.response?.data?.error || 'Invalid password'
        this.$notify.error({ title: 'Authentication failed', message })
        delete this.$axios.defaults.headers.common['x-admin-password']
      } finally {
        this.authLoading = false
      }
    },

    async searchAccount() {
      const account = this.accountName.trim().toLowerCase()
      if (!account) return

      this.searchingAccount = true
      this.searchedAccount = true
      this.accountReport = null

      try {
        const { data } = await this.$axios.post('/v2/admin/detective/account-report', { account })
        this.accountReport = data
      } catch (e) {
        const message = e.response?.data?.error || 'Search failed'
        this.$notify.error({ title: 'Account Report Error', message })
      } finally {
        this.searchingAccount = false
      }
    },

    async searchCex() {
      const memo = this.memo.trim()
      if (!memo) return

      this.searchingCex = true
      this.searchedCex = true
      this.cexResults = []
      this.cexTotal = 0

      try {
        const params = {
          memo,
          limit: this.cexLimit
        }
        if (this.cexAccount.trim()) {
          params.account = this.cexAccount.trim().toLowerCase()
        }
        if (this.dateRange && this.dateRange[0]) {
          params.after = this.dateRange[0]
        }
        if (this.dateRange && this.dateRange[1]) {
          params.before = this.dateRange[1]
        }

        const { data } = await this.$axios.get('/v2/admin/detective/cex-lookup', { params })
        this.cexResults = data.actions || []
        this.cexTotal = data.total || 0
      } catch (e) {
        const message = e.response?.data?.error || 'Search failed'
        this.$notify.error({ title: 'CEX Lookup Error', message })
      } finally {
        this.searchingCex = false
      }
    },

    formatDate(timestamp) {
      if (!timestamp) return '-'
      return new Date(timestamp).toLocaleString()
    }
  }
}
</script>

<style scoped>
.detective-page {
  max-width: 1000px;
  margin: 0 auto;
}

.auth-form {
  max-width: 300px;
  margin: 100px auto;
  text-align: center;
}

.search-form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-form .el-input {
  flex: 1;
  min-width: 200px;
}

.limit-input {
  width: 100px !important;
}

.account-input {
  max-width: 180px;
}

.result-section h4 {
  color: #909399;
  margin-bottom: 8px;
}

.result-section ul {
  margin: 0;
  padding-left: 20px;
}

.result-section li {
  font-family: monospace;
}

.summary-text {
  background: var(--background-color-secondary);
  padding: 12px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-size: 13px;
}

.info-text {
  color: #909399;
  font-size: 13px;
}

.no-results {
  color: #909399;
  text-align: center;
  padding: 40px;
}
</style>

<style>
.detective-page .el-input__inner {
  border: 1px solid #606266 !important;
  background: var(--background-color-secondary) !important;
}

.detective-page .el-input__inner:focus {
  border-color: #409eff !important;
}

.detective-page .el-collapse-item__header {
  background: transparent;
}

.detective-page .el-collapse-item__content {
  padding-bottom: 0;
}
</style>
