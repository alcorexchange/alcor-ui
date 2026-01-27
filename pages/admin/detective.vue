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
            .report-header
              h3 {{ accountReport.account }}
              .summary-badges
                el-tag(type="info") {{ accountReport.summary.ipv4Count }} IPv4
                el-tag(type="warning") {{ accountReport.summary.ipv6Count }} IPv6
                el-tag(type="danger" v-if="accountReport.summary.relatedCount") {{ accountReport.summary.relatedCount }} Related

            .result-section.mb-4(v-if="accountReport.ips && accountReport.ips.length")
              h4.section-title IP Addresses
              el-table(:data="accountReport.ips" border size="small" style="width: 100%")
                el-table-column(prop="ip" label="IP" width="140")
                el-table-column(label="Location" width="180")
                  template(slot-scope="scope")
                    span.flag {{ getFlag(scope.row.countryCode) }}
                    |  {{ scope.row.city }}, {{ scope.row.country }}
                el-table-column(prop="isp" label="ISP")
                el-table-column(label="Device" width="200")
                  template(slot-scope="scope")
                    | {{ scope.row.device }} / {{ scope.row.browser }}
                el-table-column(prop="requests" label="Req" width="60")

            .result-section(v-if="accountReport.relatedAccounts && accountReport.relatedAccounts.length")
              h4.section-title
                i.el-icon-warning-outline.text-danger
                |  Related Accounts
              el-table(:data="accountReport.relatedAccounts" border size="small" style="width: 100%")
                el-table-column(prop="account" label="Account" width="140")
                  template(slot-scope="scope")
                    a.account-link(:href="getAccountLink(scope.row.account)" target="_blank") {{ scope.row.account }}
                el-table-column(label="Matching IPs")
                  template(slot-scope="scope")
                    el-tag(
                      v-for="ip in scope.row.matchingIPs"
                      :key="ip"
                      size="mini"
                      type="danger"
                    ).ip-tag {{ ip }}
                el-table-column(label="Device" width="200")
                  template(slot-scope="scope")
                    | {{ scope.row.device }} / {{ scope.row.browser }}

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
              placeholder="CEX account (e.g., binancecleos)"
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
            .cex-summary.mb-4
              .summary-header
                span.info-text Found {{ cexTotal }} transfers from {{ cexSummary.length }} accounts
              el-table(:data="cexSummary" border size="small" style="width: 100%").mb-4
                el-table-column(prop="account" label="Account" width="150")
                  template(slot-scope="scope")
                    a.account-link(:href="getAccountLink(scope.row.account)" target="_blank") {{ scope.row.account }}
                el-table-column(prop="count" label="Transfers" width="100")
                el-table-column(label="Total Amount")
                  template(slot-scope="scope")
                    div(v-for="(amount, symbol) in scope.row.totals" :key="symbol")
                      | {{ (amount.toFixed(4) + ' ' + symbol) | commaFloat }}

            h4.section-title Transactions
            el-table(:data="cexResults" border style="width: 100%")
              el-table-column(label="TX" width="60")
                template(slot-scope="scope")
                  a.tx-link(:href="getTxLink(scope.row.trx_id)" target="_blank") TX
              el-table-column(prop="timestamp" label="Time" width="180")
                template(slot-scope="scope")
                  | {{ formatDate(scope.row.timestamp) }}
              el-table-column(prop="from" label="From" width="140")
                template(slot-scope="scope")
                  a.account-link(v-if="scope.row.act?.data?.from" :href="getAccountLink(scope.row.act.data.from)" target="_blank") {{ scope.row.act.data.from }}
                  span(v-else) -
              el-table-column(prop="to" label="To" width="140")
                template(slot-scope="scope")
                  a.account-link(v-if="scope.row.act?.data?.to" :href="getAccountLink(scope.row.act.data.to)" target="_blank") {{ scope.row.act.data.to }}
                  span(v-else) -
              el-table-column(prop="quantity" label="Quantity" width="160")
                template(slot-scope="scope")
                  | {{ scope.row.act?.data?.quantity | commaFloat }}
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
    },

    cexSummary() {
      const grouped = {}
      for (const action of this.cexResults) {
        const from = action.act?.data?.from || 'unknown'
        const quantity = action.act?.data?.quantity || ''
        const [amountStr, symbol] = quantity.split(' ')
        const amount = parseFloat(amountStr) || 0

        if (!grouped[from]) {
          grouped[from] = { account: from, count: 0, totals: {} }
        }
        grouped[from].count++
        if (symbol) {
          grouped[from].totals[symbol] = (grouped[from].totals[symbol] || 0) + amount
        }
      }
      return Object.values(grouped).sort((a, b) => b.count - a.count)
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
        const { data } = await this.$axios.post('/v2/admin/detective/account-report', { account }, { timeout: 180000 })
        this.accountReport = data
      } catch (e) {
        const message = e.response?.data?.error || e.message || 'Search failed'
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

      const hyperionUrl = this.network.hyperion
      if (!hyperionUrl) {
        this.$notify.error({ title: 'CEX Lookup Error', message: 'Hyperion not configured for this network' })
        this.searchingCex = false
        return
      }

      const params = new URLSearchParams({
        'act.name': 'transfer',
        'transfer.memo': memo,
        limit: String(this.cexLimit)
      })

      if (this.cexAccount.trim()) {
        params.set('transfer.to', this.cexAccount.trim().toLowerCase())
      }
      if (this.dateRange && this.dateRange[0]) {
        params.set('after', this.dateRange[0])
      }
      if (this.dateRange && this.dateRange[1]) {
        params.set('before', this.dateRange[1])
      }

      const url = `${hyperionUrl}/v2/history/get_actions?${params}`

      const maxRetries = 3
      let lastError = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url)
          if (!response.ok) {
            if (attempt === maxRetries) {
              throw new Error(`Hyperion error: ${response.status}`)
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          const data = await response.json()
          this.cexResults = data.actions || []
          this.cexTotal = data.total?.value || data.actions?.length || 0
          this.searchingCex = false
          return
        } catch (e) {
          lastError = e
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      this.$notify.error({ title: 'CEX Lookup Error', message: lastError?.message || 'Failed to fetch from Hyperion' })
      this.searchingCex = false
    },

    formatDate(timestamp) {
      if (!timestamp) return '-'
      return new Date(timestamp).toLocaleString()
    },

    getFlag(countryCode) {
      if (!countryCode || countryCode === '??' || countryCode === 'XX') return ''
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    },

    getTxLink(txId) {
      if (!txId) return '#'
      return `${this.network.monitor}/transaction/${txId}?tab=traces&${this.network.monitor_params || ''}`
    },

    getAccountLink(account) {
      if (!account) return '#'
      return `${this.network.monitor}/account/${account}`
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

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.report-header h3 {
  margin: 0;
  font-family: monospace;
  font-size: 18px;
}

.summary-badges {
  display: flex;
  gap: 8px;
}

.section-title {
  color: #909399;
  margin-bottom: 12px;
  font-size: 14px;
}

.section-title i {
  margin-right: 4px;
}

.text-danger {
  color: #f56c6c;
}

.flag {
  font-size: 16px;
}

.account-link {
  font-family: monospace;
  color: #409eff;
}

.ip-tag {
  margin: 2px 4px 2px 0;
  font-family: monospace;
}

.tx-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.tx-link:hover {
  text-decoration: underline;
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
