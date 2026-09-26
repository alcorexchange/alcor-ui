import { op } from '~/plugins/openpanel'
import VaultWallet from '~/plugins/wallets/Vault'
import { VAULT_ORIGIN, requestEnroll, requestImport, requestSettings } from '~/plugins/wallets/vault/popup'
import { rememberVaultSession, setVaultLevel } from '~/plugins/wallets/vault/sessions'
import { addKeyAction, keyRpid, keySignsAlone } from '~/plugins/wallets/vault/authority'

/**
 * The offer to move to Alcor Signer — a port of `useVaultEnrollment` in the new
 * Alcor (perps_ui), same rules and same events, so the two UIs compare.
 *
 * An account signed in with an old wallet gets a passkey from the vault. Two
 * ways onto the account:
 * - link: the old wallet signs one `updateauth` that adds the passkey next to
 *   its own key (WAX Cloud Wallet, WebAuth);
 * - import: wallets that will not sign `updateauth` from a website (Anchor,
 *   Wombat) — the private key is pasted in the vault window, and the vault adds
 *   the passkey itself.
 * Nothing is removed from the account either way.
 */

/** Networks the vault signs on. */
const SIGNER_CHAINS = ['wax', 'proton', 'telos']

/**
 * Old wallets the offer is for:
 * - `link` — the wallet signs the `updateauth` that adds the passkey;
 * - `import` — the private key can be pasted in the vault instead (the wallet
 *   holds one the user can copy). No `link`: import is the only way;
 * - `steps` — what every signature costs in it, against one tap in Signer.
 */
const OLD_WALLETS = {
  anchor: { name: 'Anchor', link: false, import: true, steps: ['Open app', 'Approve', 'Come back'] },
  wombat: { name: 'Wombat', link: true, import: true, steps: ['Open app', 'Approve', 'Come back'] },
  proton: { name: 'WebAuth', link: true, import: false, steps: ['Open app', 'Approve', 'Come back'] },
  wcw: { name: 'WAX Cloud Wallet', link: true, import: false, steps: ['Pop-up', 'Approve', 'Close'] },
}

/** The window opened by itself once in this browser. After that — only from the account menu. */
const SHOWN_KEY = 'alcor.vault.enroll.shown'
/** When the window last came by itself after a successful signature. */
const OFFERED_AT_KEY = 'alcor.vault.enroll.offered-at'
/** When "Not now" was last pressed. */
const DISMISSED_AT_KEY = 'alcor.vault.enroll.dismissed-at'

const DAY_MS = 24 * 60 * 60 * 1000
/**
 * After a successful trade — not more often: the trade went through, nothing
 * to insist on. Every time on phones read as spam after every swap. Once a day
 * here, where the new Alcor waits three: the legacy UI is the one we want
 * people off first.
 */
const OFFER_COOLDOWN_MS = DAY_MS
/** "Not now" — as long a silence after successful trades. A failed signature still calls. */
const SNOOZE_MS = DAY_MS
/** Successful trade: let the result show before the window covers it. */
const AFTER_SUCCESS_DELAY_MS = 1500

/** How many times to sign in without the window while a lagging node has not seen the fresh key yet. */
const SWITCH_ATTEMPTS = 3
const SWITCH_RETRY_MS = 1500

/** The vault's domain without a port — exactly how the chain keeps it inside `PUB_WA_`. */
const VAULT_RPID = new URL(VAULT_ORIGIN).hostname

/** Linked: our passkey is on the permission and signs alone. */
const linked = (authority) =>
  authority.keys.some((entry) => keyRpid(entry.key) === VAULT_RPID && keySignsAlone(authority, entry.key))

/** Run once the tab is visible: a signature often ends in another app, and a window there is shown to no one. */
function whenVisible(show) {
  if (document.visibilityState === 'visible') return show()
  document.addEventListener('visibilitychange', () => whenVisible(show), { once: true })
}

const readNumber = (key) => Number(localStorage.getItem(key)) || 0

const errorMessage = (e) => e?.message ?? String(e)

/**
 * The contract said no (slippage, limits) — the wallet has nothing to do with
 * it, and Signer changes nothing. Every other failure is the wallet's.
 */
const isContractRejection = (e) => /assertion failure/i.test(errorMessage(e))

export const state = () => ({
  isOpen: false,
  busy: false,
  error: null,
  done: false,
  /** Came by itself, mid-task: one line and "try it?" first, the full story only after yes. */
  teasing: false,
  /** `{ wallet, failed }` — opened right after a signature in this wallet; null otherwise. */
  offeredAfter: null,

  /** The permission's authority from the chain — the only truth about whether to offer. */
  authority: null,
  parent: '',
  /** Keys from the vault not on the account yet: the passkey and, if left ticked, the fast key. */
  pendingKeys: [],
  /** The passkey the vault handed over in this link or import. */
  linkedKey: null,
})

export const mutations = {
  set: (state, patch) => Object.assign(state, patch),
}

export const getters = {
  /** The signed-in account, if the offer is for it at all. */
  target(state, getters, rootState) {
    const user = rootState.user
    const chain = rootState.network.name
    if (!user?.authorization?.actor || user.viewOnly || !SIGNER_CHAINS.includes(chain)) return null

    // The wallet itself, not `lastWallet`: a manual login records that only after the login hook.
    return { chain, account: user.name, permission: user.authorization.permission, wallet: rootState.chain.wallet?.name }
  },

  oldWallet: (state, getters) => OLD_WALLETS[getters.target?.wallet] ?? null,

  /** Signed in with an old wallet, and the passkey is not on the account yet — the menu item. */
  available: (state, getters) => Boolean(getters.oldWallet) && !(state.authority && linked(state.authority)),

  /** The passkey is on the account, but they signed in with the old wallet: offer to switch. */
  ready: (state, getters) => Boolean(getters.oldWallet && state.authority && linked(state.authority)),

  /** Something to offer: link/import, or switch. */
  shouldOffer: (state, getters) => Boolean(getters.oldWallet && state.authority),

  importOnly: (state, getters) => Boolean(getters.oldWallet && !getters.oldWallet.link),

  /** Linking is the main way, but pasting the private key is offered too. */
  canImport: (state, getters) => Boolean(getters.oldWallet?.link && getters.oldWallet.import),

  mode: (state, getters) => (getters.ready ? 'switch' : getters.importOnly ? 'import' : 'link'),

  /**
   * The Signer key on the account, to sign in with it without the account
   * picker: the one just linked, or the only one of ours on the permission.
   */
  signerKey(state) {
    if (state.done && state.linkedKey) return state.linkedKey

    const ours = (state.authority?.keys ?? [])
      .filter((entry) => keyRpid(entry.key) === VAULT_RPID && keySignsAlone(state.authority, entry.key))
      .map((entry) => entry.key)
    return ours.length === 1 ? ours[0] : null
  },

  /** Signing mode of an account signed in with Alcor Signer; null for everyone else. */
  level: (state, getters, rootState) =>
    rootState.chain.wallet?.name === 'vault' ? (rootState.chain.wallet.session?.level ?? null) : null,
}

export const actions = {
  track({ getters }, [event, props = {}]) {
    op.track(event, { chain: getters.target?.chain, wallet: getters.target?.wallet, ...props })
  },

  /**
   * The account changed (login, restore, logout): read the chain again rather
   * than guess from the last answer, and open by itself once per browser.
   */
  async accountChanged({ state, getters, commit, dispatch }, { source } = {}) {
    commit('set', { isOpen: false, done: false, linkedKey: null, pendingKeys: [], authority: null, parent: '' })

    const target = getters.target
    if (!target || !getters.oldWallet) return

    try {
      const account = await this.$rpc.get_account(target.account)
      const found = (account.permissions ?? []).find((entry) => entry.perm_name === target.permission)
      if (getters.target?.account !== target.account) return

      commit('set', { authority: found?.required_auth ?? null, parent: found?.parent ?? '' })
    } catch {
      // The node did not answer — stay quiet: the offer is not worth an error nobody asked for.
      return
    }

    if (!getters.shouldOffer || localStorage.getItem(SHOWN_KEY)) return

    whenVisible(() => {
      if (!getters.shouldOffer || state.isOpen || localStorage.getItem(SHOWN_KEY)) return

      localStorage.setItem(SHOWN_KEY, '1')
      dispatch('open', { trigger: source === 'manual' ? 'after_login' : 'restore' })
      // Came by itself right after connecting: the short screen first, as after a signature.
      dispatch('set', { offeredAfter: { wallet: getters.oldWallet, failed: false }, teasing: true })
    })
  },

  /**
   * Just signed with an old wallet — the best moment to show there is another
   * way. A failure: every time. A success: once per `OFFER_COOLDOWN_MS`, and
   * not within `SNOOZE_MS` of "Not now".
   */
  afterSigning({ state, getters, dispatch }, { error }) {
    const wallet = getters.oldWallet
    const account = getters.target?.account
    if (!wallet || !getters.shouldOffer || (error && isContractRejection(error))) return

    const failed = Boolean(error)
    const due = () =>
      failed ||
      (Date.now() - readNumber(OFFERED_AT_KEY) >= OFFER_COOLDOWN_MS &&
        Date.now() - readNumber(DISMISSED_AT_KEY) >= SNOOZE_MS)
    if (!due()) return

    const show = () =>
      whenVisible(() => {
        if (!getters.shouldOffer || getters.target?.account !== account || state.isOpen || !due()) return

        if (!failed) localStorage.setItem(OFFERED_AT_KEY, String(Date.now()))
        dispatch('open', { trigger: failed ? 'sign_failed' : 'signed', props: failed ? { error: errorMessage(error) } : {} })
        dispatch('set', { offeredAfter: { wallet, failed }, teasing: true })
      })

    failed ? show() : setTimeout(show, AFTER_SUCCESS_DELAY_MS)
  },

  set({ commit }, patch) {
    commit('set', patch)
  },

  open({ getters, commit, dispatch }, { trigger = 'menu', props = {} } = {}) {
    commit('set', { isOpen: true, error: null, done: false, teasing: false, offeredAfter: null })
    dispatch('track', ['signer_offer_shown', { trigger, mode: getters.mode, ...props }])
  },

  close({ commit }) {
    commit('set', { isOpen: false })
  },

  /** "Not now" / "Keep current wallet". The step they left on says what put them off. */
  dismiss({ state, getters, dispatch }) {
    const step = state.teasing
      ? 'teaser'
      : state.pendingKeys.length
        ? 'authorise'
        : state.done || getters.ready
          ? 'switch'
          : 'intro'
    dispatch('track', ['signer_offer_dismissed', { step }])
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
    dispatch('close')
  },

  /** Said yes to the invitation — show how to move. */
  proceed({ commit, dispatch }) {
    commit('set', { teasing: false })
    dispatch('track', ['signer_offer_accepted'])
  },

  /**
   * Link, step 1: a key from the vault. Separate from step 2 because both open a
   * window of their own, and the browser allows that only on a fresh click.
   * The vault window opens synchronously, before anything is awaited.
   */
  async createKey({ state, getters, commit, dispatch }) {
    const target = getters.target
    if (!target) return false

    commit('set', { busy: true, error: null })
    try {
      const enrolled = await requestEnroll(target.chain, target.account, target.permission)
      dispatch('track', ['signer_key_created', { fast_sign: Boolean(enrolled.tradeKey) }])

      // A key already there and signing alone needs nothing; one below the threshold stays — the action raises it.
      const keys = [enrolled.publicKey, enrolled.tradeKey].filter(
        (key) => key && !(state.authority && keySignsAlone(state.authority, key))
      )
      commit('set', { linkedKey: enrolled.publicKey, pendingKeys: keys, done: keys.length === 0 })
      return true
    } catch (e) {
      commit('set', { error: errorMessage(e) })
      dispatch('track', ['signer_key_failed', { error_code: e.code, error: errorMessage(e) }])
      return false
    } finally {
      commit('set', { busy: false })
    }
  },

  /** Link, step 2: let the key sign — with the wallet the user already has. */
  async authorise({ state, getters, commit, dispatch }) {
    const target = getters.target
    if (!target || !state.authority || !state.pendingKeys.length) return false

    const action = addKeyAction(target.account, target.permission, state.parent, state.authority, state.pendingKeys)

    commit('set', { busy: true, error: null })
    try {
      await dispatch('chain/sendTransaction', [action], { root: true })
      dispatch('track', ['signer_linked', { keys: state.pendingKeys.length }])

      // Reading the node right away would miss it: a neighbour node has not seen the
      // transaction yet. The node accepted it — so this is what is on chain now.
      commit('set', { authority: action.data.auth, done: true, pendingKeys: [] })
      return true
    } catch (e) {
      commit('set', { error: errorMessage(e) })
      dispatch('track', ['signer_link_failed', { error: errorMessage(e) }])
      return false
    } finally {
      commit('set', { busy: false })
    }
  },

  /** Import — for wallets that will not sign `updateauth` (Anchor), or instead of linking (Wombat). */
  async importKey({ getters, commit, dispatch }) {
    const target = getters.target
    if (!target) return false

    dispatch('track', ['signer_import_clicked'])
    commit('set', { busy: true, error: null })
    try {
      const imported = await requestImport(target.chain, target.account)

      // One key can have several accounts, and the tick for this one could have been removed.
      if (!imported.accounts.includes(target.account)) {
        const error = `${target.account} was not imported — Alcor Signer imported ${imported.accounts.join(', ')}`
        commit('set', { error })
        dispatch('track', ['signer_import_failed', { error_code: 'OTHER_ACCOUNT', error }])
        return false
      }

      dispatch('track', ['signer_imported', { accounts: imported.accounts.length }])
      commit('set', { linkedKey: imported.publicKey, done: true })
      return true
    } catch (e) {
      commit('set', { error: errorMessage(e) })
      dispatch('track', ['signer_import_failed', { error_code: e.code, error: errorMessage(e) }])
      return false
    } finally {
      commit('set', { busy: false })
    }
  },

  /**
   * Move to Alcor Signer with the same account, without the account picker: the
   * key is known. The link went to one node and the check may hit a lagging
   * one — hence a few retries. No luck — the ordinary wallet picker.
   */
  async switchToSigner({ getters, commit, dispatch, rootState }) {
    const target = getters.target
    const publicKey = getters.signerKey

    const attempts = target && publicKey ? SWITCH_ATTEMPTS : 0

    for (let attempt = 0; attempt < attempts; attempt++) {
      // Again on every attempt: a failed check forgets the login.
      rememberVaultSession({ chain: target.chain, account: target.account, permission: target.permission, publicKey })

      const wallet = new VaultWallet(rootState.network, this.$rpc)
      const login = await wallet.checkLogin().catch(() => null)

      if (login) {
        dispatch('track', ['signer_switched', { ok: true, picker: false }])
        commit('chain/setWallet', wallet, { root: true })
        commit('chain/setLastWallet', 'vault', { root: true })
        commit('setUser', { name: login.name, authorization: login.authorization }, { root: true })
        dispatch('chain/afterLoginHook', { source: 'manual' }, { root: true })
        dispatch('close')
        return true
      }
      await new Promise((resolve) => setTimeout(resolve, SWITCH_RETRY_MS))
    }

    dispatch('track', ['signer_switched', { ok: false, picker: true }])
    dispatch('close')
    dispatch('chain/mainLogin', null, { root: true })
    return false
  },

  /** Signing mode — changed only in the vault window; the app learns the result when it closes. */
  async manageLevel({ getters, rootState, dispatch }) {
    const wallet = rootState.chain.wallet
    const session = wallet?.session
    if (wallet?.name !== 'vault' || !session) return

    try {
      const before = session.level
      const { level } = await requestSettings(session.chain, session.account)

      wallet.session = { ...session, level }
      setVaultLevel(session.chain, session.account, level)
      if (level !== before) dispatch('track', ['signer_level_changed', { from: before, to: level }])
    } catch {
      // Closed before the mode was known — the label stays as it was.
    }
  },
}
