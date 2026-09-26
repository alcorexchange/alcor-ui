<template lang="pug">
//- The offer to move to Alcor Signer — a port of `VaultEnrollModal` in the new
//- Alcor (perps_ui), same screens and wording. State and rules: `store/signer.js`.
//- `before-close` rather than `@close`: element-ui fires `close` on every hide,
//- and a successful switch would count as a refusal.
ElDialog.signer-offer(
  :visible='isOpen',
  :title='title',
  :before-close='() => dismiss()',
  :close-on-click-modal='false',
  append-to-body,
  width='420px'
)
  .enroll
    //- Came up on its own, right after a signature in the old wallet: one line
    //- and a yes/no. The full story is for those who said yes.
    template(v-if='teasing && offeredAfter')
      p.lead
        template(v-if='offeredAfter.failed') That one didn't go through.&nbsp;
        template(v-if='offeredAfter.wallet.replace')
          | {{ offeredAfter.wallet.name }} is no longer recommended on Alcor — Alcor Signer is its replacement.
        template(v-else) Try Alcor Signer — trades confirm with a passkey right on this page.

      //- The whole pitch in one picture: the trip every signature takes, or one tap.
      .compare
        .compare-row.old
          img.compare-icon(:src='walletLogo', alt='')
          span.compare-name {{ offeredAfter.wallet.name }}
          span.compare-steps
            template(v-for='(step, index) in offeredAfter.wallet.steps')
              i.el-icon-arrow-right(v-if='index')
              | {{ step }}
        .compare-row.new
          img.compare-icon(:src='signerLogo', alt='')
          span.compare-name Alcor Signer
          span.compare-steps
            i.el-icon-lightning
            | One tap, passkey

      .actions
        AlcorButton(access, @click='proceed') {{ offeredAfter.wallet.replace ? 'Upgrade' : 'Try it' }} · takes a minute
        AlcorButton(transparent, @click='dismiss') Not now

    //- Just linked, or linked earlier and signed in with the old wallet today:
    //- either way the next step is the same — switch.
    template(v-else-if='done || ready')
      .state
        i.el-icon-circle-check.state-icon
        span(v-if='done') #[b {{ accountName }}] can now be signed with your passkey
        span(v-else) #[b {{ accountName }}] already has a passkey in Alcor Signer
      p.note
        | Switch to trade in one click, or pick #[b Alcor Signer] next time you connect. Your
        | current wallet keeps working — nothing changes on the account.
      .actions
        AlcorButton(access, :disabled='switching', @click='switchToVault') {{ switching ? 'Switching…' : 'Switch to Alcor Signer' }}
        AlcorButton(transparent, :disabled='switching', @click='dismiss') Keep current wallet

    //- Anchor refuses to sign a key change from a website. The one way over is
    //- the private key, pasted in Alcor Signer itself — never here.
    template(v-else-if='importOnly')
      p.lead
        | Link #[b {{ accountName }}] on {{ chainName }} to Alcor Signer: trades confirm with one
        | click — or with none. You pick the mode in the Signer window.

      .points
        .point
          i.el-icon-lock.point-icon
          .point-body
            .point-title {{ walletName }} keeps working
            .point-sub A passkey is added next to its key. Nothing is removed.
        .point
          i.el-icon-refresh-left.point-icon
          .point-body
            .point-title Try it — undo anytime
            .point-sub Don't like it? Remove the passkey in Alcor Signer and everything is as before.
        .point
          i.el-icon-document-copy.point-icon
          .point-body
            .point-title Copy, paste — done
            .point-sub
              | {{ walletName }} can't add a passkey from a website. Copy the private key of
              | #[b {{ accountName }}] in {{ walletName }} and paste it under #[b Import] in Alcor Signer.
        .point
          i.el-icon-mobile-phone.point-icon
          .point-body
            .point-title Phone and computer
            .point-sub The passkey syncs through iCloud Keychain or Google, so the same account works on all your devices.

      .enroll-warn
        | Paste the key only on {{ vaultHost }}. It is used once and never stored — Alcor never
        | asks for it anywhere else.

      .enroll-error(v-if='error') {{ error }}

      .actions
        AlcorButton(access, :disabled='busy || switching', @click='importAndSwitch') {{ busy || switching ? 'Waiting for Alcor Signer…' : 'Open Alcor Signer' }}
        AlcorButton(transparent, :disabled='busy || switching', @click='dismiss') Not now

    template(v-else)
      p.lead
        | Link #[b {{ accountName }}] on {{ chainName }} to Alcor Signer: trades confirm with one
        | click — or with none. You pick the mode in the Signer window.

      .points
        .point
          i.el-icon-lock.point-icon
          .point-body
            .point-title Your wallet keeps working
            .point-sub A passkey is added next to it. Nothing is removed.
        .point
          i.el-icon-refresh-left.point-icon
          .point-body
            .point-title Try it — undo anytime
            .point-sub Don't like it? Remove the passkey in Alcor Signer and everything is as before.
        .point
          i.el-icon-key.point-icon
          .point-body
            .point-title Two clicks now, one per trade after
            .point-sub A passkey here, one approval in your wallet.
        .point
          i.el-icon-mobile-phone.point-icon
          .point-body
            .point-title Phone and computer
            .point-sub The passkey syncs through iCloud Keychain or Google, so the same account works on all your devices.

      .enroll-step(v-if='pendingKeys.length')
        | {{ pendingKeys.length > 1 ? 'The passkey and the browser key are ready.' : 'Key created.' }}
        | One more step: your wallet has to authorise {{ pendingKeys.length > 1 ? 'them' : 'it' }} —
        | that opens your wallet, not Alcor Signer.

      .enroll-error(v-if='error') {{ error }}

      //- Two clicks, not one: each opens a window of its own, and the browser
      //- only allows that on a fresh gesture.
      .actions
        AlcorButton(v-if='!pendingKeys.length', access, :disabled='busy', @click='createKey') {{ busy ? 'Waiting for Alcor Signer…' : 'Try Alcor Signer' }}
        AlcorButton(v-else, access, :disabled='busy || switching', @click='authoriseAndSwitch') {{ busy || switching ? 'Waiting for your wallet…' : 'Authorise it with your wallet' }}
        AlcorButton(transparent, :disabled='busy', @click='dismiss') Not now

      //- The wallet holds a key the user can copy: pasting it in Alcor Signer is
      //- the other way over, for when the wallet will not sign the link.
      .alt(v-if='canImport')
        | Or copy the private key of #[b {{ accountName }}] in {{ walletName }} and
        a(@click.prevent='importAndSwitch', href='#') paste it in Alcor Signer
        | . Only on {{ vaultHost }} — it is used once and never stored.
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import { VAULT_ORIGIN } from '~/plugins/wallets/vault/popup'

export default {
  name: 'SignerOfferModal',
  components: { AlcorButton },

  data() {
    return {
      switching: false,
      vaultHost: new URL(VAULT_ORIGIN).host,
      signerLogo: require('@/assets/logos/alcor-signer.svg'),
    }
  },

  computed: {
    ...mapState('signer', ['isOpen', 'busy', 'error', 'done', 'teasing', 'offeredAfter', 'pendingKeys']),
    ...mapGetters('signer', ['ready', 'importOnly', 'canImport', 'target', 'oldWallet']),
    ...mapState(['network']),

    accountName() {
      return this.target?.account ?? ''
    },

    chainName() {
      return this.network.desc
    },

    walletName() {
      return this.oldWallet?.name ?? 'Your wallet'
    },

    walletLogo() {
      const logos = {
        anchor: require('@/assets/logos/anchor.svg'),
        wcw: require('@/assets/logos/wax.svg'),
        proton: require('@/assets/icons/proton.png'),
        wombat: require(`@/assets/logos/wombat_${this.$colorMode.value}.png`),
      }
      return logos[this.target?.wallet]
    },

    title() {
      if (this.teasing && this.offeredAfter) {
        return this.offeredAfter.wallet.replace ? `Upgrade from ${this.offeredAfter.wallet.name}` : 'Sign trades faster'
      }
      if (this.done) return 'Alcor Signer is on'
      return this.ready ? 'Alcor Signer is ready' : 'Trade in one click'
    },
  },

  methods: {
    ...mapActions('signer', ['dismiss', 'proceed', 'createKey', 'authorise', 'importKey', 'switchToSigner']),

    /** Linked — switch right away: the point of linking is to use it. */
    async authoriseAndSwitch() {
      if (await this.authorise()) await this.switchToVault()
    },

    /** Imported in the Signer window — same: sign in with it right away. */
    async importAndSwitch() {
      if (await this.importKey()) await this.switchToVault()
    },

    async switchToVault() {
      this.switching = true
      try {
        await this.switchToSigner()
      } finally {
        this.switching = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.signer-offer ::v-deep .el-dialog {
  max-width: calc(100vw - 32px);
  border-radius: 16px;
}

.enroll {
  display: flex;
  flex-direction: column;
  gap: 16px;
  word-break: normal;
}

.lead {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-default);
}

.note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-disable);
}

.compare {
  display: flex;
  flex-direction: column;
}

.compare-row {
  display: grid;
  grid-template-columns: 22px auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px 0;

  & + & {
    border-top: 1px solid var(--border-color);
  }

  &.old {
    color: var(--text-disable);
  }

  &.new {
    color: var(--text-default);

    .compare-steps {
      color: var(--main-green);
    }
  }
}

.compare-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.compare-name {
  font-size: 14px;
  font-weight: 500;
}

.compare-steps {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.points {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.point {
  display: flex;
  gap: 12px;
}

.point-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 15px;
  color: var(--main-green);
}

.point-title {
  font-size: 13px;
  color: var(--text-default);
}

.point-sub {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-disable);
}

.state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-default);
}

.state-icon {
  color: var(--main-green);
}

.enroll-warn,
.enroll-step {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-disable);
}

.alt {
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
  color: var(--text-disable);

  a {
    color: var(--main-green);
    cursor: pointer;
  }
}

.enroll-error {
  font-size: 12px;
  color: var(--main-red);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .alcor-button {
    width: 100%;
  }
}
</style>
