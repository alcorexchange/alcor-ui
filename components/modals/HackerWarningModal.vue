<template lang="pug">
  ElDialog(:visible.sync="visible" :title="title" class="hacker-warning-modal" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false")
    template(#title)
      .pr-4.fs-24.text-danger.fw-bold {{ title }}
    .dialog-content
      .main-content
        p.fs-18.fw-bold You've been identified as the operator behind recent XPR scams. You're online here right now from a London mobile network, using the same device fingerprint. We know your exchange routes (KuCoin/MEXC) and your USDC destination on Ethereum: 0xc54a8358213B7C72C5DCb1ADc8e12271f93e1533. We also have the CEX deposit details: KuCoin Deposit ID 1897163629 (acct kucoindotxpr) and MEXC Deposit ID 102010 (acct mexcloanloan).

        .pt-4
          p.fs-18.fw-bold.text-warning Offer (24 hours):
          p Send back the full amount to 0x049c340f0dB461b51Fc49767E72A5ABc179b5a03 and message me at @avral on Telegram. If you do this within 24 hours, we will pay a $10,000 bug bounty and close the matter on our side.

        .pt-4
          p.fs-18.fw-bold.text-danger Otherwise:
          p We will proceed with formal reports to law enforcement and to compliance at Circle (USDC), KuCoin, and MEXC, along with your network/device evidence. In the UK, this conduct may be chargeable under:
          ul.pt-2
            li • Fraud Act 2006 — up to 10 years
            li • Computer Misuse Act — up to 10 years
            li • Proceeds of Crime Act (money laundering) — up to 14 years

        p.pt-4.fs-18.fw-bold.text-center This is a one-time offer. The clock is running.
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'HackerWarningModal',

  data: () => ({
    visible: false,
    title: 'Return the funds — last chance',
    hackerAccounts: [
      'kaisarrr',
      'metalapp',
      'ahava',
      'xmetalxpr',
      'ratri',
      'xeosio',
      'xxxpr',
      'xasterdex',
      'xplasma',
      'croydon'
    ]
  }),

  computed: {
    ...mapState(['user']),
  },

  watch: {
    user: {
      handler(newUser) {
        this.checkUser()
      },
      immediate: true
    }
  },

  mounted() {
    this.checkUser()
  },

  methods: {
    checkUser() {
      if (this.user && this.user.name) {
        if (this.hackerAccounts.includes(this.user.name.toLowerCase())) {
          this.visible = true
        }
      }
    }
  }
}
</script>

<style lang="scss">
.hacker-warning-modal {
  .el-dialog {
    width: 95%;
    max-width: 800px;
    background: #1a1a1a;
    border: 3px solid #dc3545;
  }

  .el-dialog__header {
    background: #dc3545;
    padding: 20px;
  }

  .el-dialog__body {
    padding: 30px;
    background: #1a1a1a;
    color: #f8f9fa;
    font-size: 16px;
    line-height: 1.6;
  }

  .text-danger {
    color: #dc3545 !important;
  }

  .text-warning {
    color: #ffc107 !important;
  }

  ul {
    li {
      list-style: none;
      padding-top: 4px;
      font-size: 16px;
    }
  }

  .main-content {
    p {
      margin-bottom: 8px;
    }
  }
}
</style>
