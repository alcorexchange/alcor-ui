import { requestAutoSignature, requestLevel, requestLogin, requestSignature, warmAutoSigner } from './vault/popup'
import { forgetVaultSession, lastVaultSession, rememberVaultSession, setVaultLevel } from './vault/sessions'

/**
 * Alcor Signer: a passkey wallet on its own origin (sign.alcor.exchange). This
 * page holds no key and cannot sign: it opens the vault window and waits.
 *
 * The vault builds the transaction itself (expiration, TAPOS, chain id — the
 * things the user never sees on the confirm screen), so `transact` options are
 * ignored. It never broadcasts: the store pushes, as for every other wallet.
 * The WAX CPU payer `noop` is recognised by the vault and shown as "paid by Alcor".
 *
 * Networks: the ones the vault can sign on — wax, proton (xpr there), telos.
 */
export default class VaultWallet {
  name = 'vault'
  network = null
  rpc = null
  session = null
  watchingLevel = false

  constructor(network, rpc) {
    this.network = network
    this.rpc = rpc
  }

  /** The login remembered from last time, checked against the chain — no window. */
  async checkLogin() {
    if (this.session) return this.loggedIn()

    const remembered = lastVaultSession(this.network.name)
    if (!remembered) return null

    const permission = await this.authorizedPermission(remembered.account, remembered.publicKey)
    if (!permission) {
      // The key was taken off the account: forget it, or every reload hits it again.
      forgetVaultSession(this.network.name, remembered.account)
      return null
    }

    this.start({ ...remembered, permission })
    return this.loggedIn()
  }

  /** Open the vault: the user picks a passkey and an account there. */
  async login() {
    const { publicKey, account, level } = await requestLogin(this.network.name)

    const permission = await this.authorizedPermission(account, publicKey)
    if (!permission) throw new Error(`${account} on ${this.network.desc} is not authorized by this passkey`)

    this.start({ chain: this.network.name, account, permission, publicKey, level })
    rememberVaultSession(this.session)
    return this.loggedIn()
  }

  logout() {
    if (this.session) forgetVaultSession(this.network.name, this.session.account)
    this.session = null
  }

  /**
   * Without a window only when the account has Auto sign — and the vault still
   * decides. Otherwise the window opens right away, in the same click: Safari
   * lets a popup through only synchronously from the gesture.
   *
   * The window tells the account's mode back, so a stale one (Auto turned on in
   * the vault itself) opens the window once at most.
   */
  async transact({ actions }) {
    if (!this.session) throw new Error('Alcor Signer is not connected')

    const chain = this.network.name
    const { account } = this.session
    const auto = this.session.level === 'auto' ? await requestAutoSignature(chain, actions) : null
    const signed =
      auto ?? (await requestSignature(chain, this.session.publicKey, actions, (level) => this.rememberLevel(account, level)))

    return {
      signatures: signed.signatures,
      serializedTransaction: Uint8Array.from(signed.serializedTransaction),
    }
  }

  start(session) {
    this.session = session
    // Auto sign goes through an iframe — let it load now, not on the first trade.
    warmAutoSigner()
    this.watchLevel()
    this.refreshLevel()
  }

  /** Only for the account asked about: the user may have switched while the answer was on its way. */
  rememberLevel(account, level) {
    if (this.session?.account !== account) return
    this.session = { ...this.session, level }
    setVaultLevel(this.session.chain, account, level)
  }

  /** Check the remembered mode with the vault's iframe. No answer — keep what we had. */
  async refreshLevel() {
    if (!this.session) return
    const { chain, account } = this.session
    const level = await requestLevel(chain, account)
    if (level) this.rememberLevel(account, level)
  }

  // Auto may be turned on in the vault's own tab: check again when the user comes back,
  // so even the first trade after that goes without a window.
  watchLevel() {
    if (this.watchingLevel || typeof document === 'undefined') return
    this.watchingLevel = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.refreshLevel()
    })
  }

  loggedIn() {
    const { account, permission } = this.session
    return { chainId: this.network.chainId, name: account, authorization: { actor: account, permission } }
  }

  /**
   * The permission this key signs for on the account, straight from the chain:
   * the account name comes from the vault or from memory, and a key taken off
   * the account must stop logging in. `active` when the key is on both — owner
   * is there to survive a lost key, not to trade with.
   */
  async authorizedPermission(account, publicKey) {
    const { accounts = [] } = await this.rpc.fetch('/v1/chain/get_accounts_by_authorizers', { keys: [publicKey] })
    const permissions = accounts
      .filter((entry) => entry.account_name === account)
      .map((entry) => entry.permission_name)

    return permissions.includes('active') ? 'active' : (permissions[0] ?? null)
  }
}
