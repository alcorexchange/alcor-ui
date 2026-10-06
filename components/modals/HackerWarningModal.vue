<template lang="pug">
  ElDialog(:visible.sync="visible" :title="title" class="hacker-warning-modal" :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false")
    template(#title)
      .pr-4.fs-24.text-danger.fw-bold {{ title }}
    .dialog-content
      .main-content
        p.fs-16 You've been identified as the operator who exploited a vulnerability in Alcor's smart contract on October 6th, stealing approximately $100,000. You are online here right now from a London mobile network, using the same device fingerprint. We know your on-chain routes and the current USDC location on Ethereum:
        p.fs-16.fw-bold.text-warning.text-center 0xc54a8358213B7C72C5DCb1ADc8e12271f93e1533
        p.fs-16 We also hold your exchange deposit references:
        p.fs-16.fw-bold.text-warning.text-center KuCoin Deposit ID 1897163629 (acct kucoindotxpr)
        p.fs-16.fw-bold.text-warning.text-center MEXC Deposit ID 102010 (acct mexcloanloan)

        .pt-4
          p.fs-18.fw-bold.text-warning Offer (24 hours):
          p.fs-16 Send back the full amount to
            span.fw-bold.text-warning  0x049c340f0dB461b51Fc49767E72A5ABc179b5a03
            |  and message me on Telegram
            span.fw-bold.text-warning  @avral
            | . If you do this within 24 hours, we will pay a
            span.fw-bold.text-success  $10,000 bug bounty
            |  and close the matter on our side.

        .pt-4
          p.fs-18.fw-bold.text-danger Otherwise (police action):
          p.fs-16 We will file formal criminal reports in the UK and our local jurisdiction and provide your network/device evidence (timestamps, IPs, carrier, device fingerprint) and on-chain tracing. With this evidence, identification is straightforward; police can lawfully obtain your subscriber details and attend your home address. In England, penalties for this conduct are serious and may include:
          ul.pt-2
            li.fs-16 • Fraud Act 2006 — up to 10 years
            li.fs-16 • Computer Misuse Act 1990 (s.3) — up to 10 years
            li.fs-16 • Proceeds of Crime Act 2002 (money laundering) — up to 14 years

        .pt-4.evidence-section
          p.fs-16.fw-bold.text-center.text-info — Compact evidence snapshot —

          .evidence-block.pt-3
            p.fs-14.fw-bold.text-warning • Exchanges:
            p.fs-14.ml-3 KuCoin (Dep ID
              span.fw-bold.text-warning  1897163629
              |  /
              span.fw-bold.text-warning  kucoindotxpr
              | )
            p.fs-14.ml-3 MEXC (Dep ID
              span.fw-bold.text-warning  102010
              |  /
              span.fw-bold.text-warning  mexcloanloan
              | )

          .evidence-block.pt-3
            p.fs-14.fw-bold.text-warning • Carrier/ISP:
            p.fs-14.ml-3 Three UK (H3G UK) — mobile broadband, UK

          .evidence-block.pt-3
            p.fs-14.fw-bold.text-warning • Your IP addresses:
            p.fs-14.ml-3.fw-bold.text-danger 2a04:4a43:97df:f0b9:9870:1e76:8643:a85c
            p.fs-14.ml-3.text-muted 2a04:4a43:970f:f4c1:9567:9f80:ebec:ca34
            p.fs-14.ml-3.text-muted 188.29.111.24

          .evidence-block.pt-3
            p.fs-14.fw-bold.text-warning • Device fingerprint:
            p.fs-14.ml-3.text-break Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15
            p.fs-14.ml-3 Browser:
              span.fw-bold  Safari 18.6
              |  | OS:
              span.fw-bold  macOS 10.15.7 (Catalina)
              |  | Device:
              span.fw-bold  Intel Mac
            p.fs-14.ml-3.fw-bold.text-danger 100% identical across all IPs

        p.pt-4.fs-18.fw-bold.text-center.text-danger This is a one-time offer. The clock is running.
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

  .text-success {
    color: #28a745 !important;
  }

  .text-info {
    color: #17a2b8 !important;
  }

  .text-muted {
    color: #6c757d !important;
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

  .evidence-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid rgba(255, 193, 7, 0.3);
  }

  .evidence-block {
    p {
      margin-bottom: 4px;
    }
  }

  .ml-3 {
    margin-left: 1.5rem;
  }

  .text-break {
    word-break: break-all;
  }
}
</style>
