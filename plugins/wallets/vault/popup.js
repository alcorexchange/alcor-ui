/**
 * App side of the app ↔ Alcor Signer protocol. A port of `lib/vault/popup.ts`
 * in the new Alcor (perps_ui) — keep the two in step.
 *
 * Everything the user has to see is a popup, not an iframe: the popup shows the
 * vault's real domain in its address bar. The only iframe is Auto sign, which
 * has no screens at all.
 *
 * The vault talks only to the app origins it lists (`public/chain.js` in the
 * alcor-signer repo), so this origin has to be there.
 */

export const VAULT_ORIGIN =
  process.env.NODE_ENV === 'development' ? 'https://sign.localhost:8443' : 'https://sign.alcor.exchange'

export class VaultError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

/** Open the vault and ask for a public key and the account the user picks there. */
export function requestLogin(chain) {
  return request({ kind: 'login', chain })
}

/**
 * Open the vault and ask for a key for an account that exists already. The key
 * is not on the account yet: the wallet the user is signed in with adds it.
 * Answers `{ publicKey, credentialId, tradeKey? }`.
 */
export function requestEnroll(chain, account, permission) {
  return request({ kind: 'enroll', chain, account, permission })
}

/**
 * Open the import screen of the vault — for wallets that will not sign
 * `updateauth` from a website (Anchor, Wombat). The private key is pasted in
 * the vault window, never here; the vault signs and pushes itself and answers
 * `{ publicKey, credentialId, accounts }`.
 */
export function requestImport(chain, account) {
  return request({ kind: 'import', chain, account })
}

/** Open the signing mode of the account in the vault. Answers `{ level }` once the window is closed. */
export function requestSettings(chain, account) {
  return request({ kind: 'settings', chain, account })
}

/** Open the vault, show the actions to the user and get a signature. */
export function requestSignature(chain, publicKey, actions) {
  return request({ kind: 'sign', chain, publicKey, actions })
}

let autoFrame = null
let autoReady = false

/** Load the Auto sign iframe ahead of time: it has to be ready by the first signature. */
export function warmAutoSigner() {
  if (autoFrame || typeof document === 'undefined') return

  const frame = document.createElement('iframe')
  frame.src = VAULT_ORIGIN
  frame.hidden = true
  frame.tabIndex = -1
  frame.setAttribute('aria-hidden', 'true')

  window.addEventListener('message', (event) => {
    if (event.origin === VAULT_ORIGIN && event.source === frame.contentWindow && event.data?.type === 'vault:ready') {
      autoReady = true
    }
  })

  document.body.append(frame)
  autoFrame = frame
}

/** How long to wait for the iframe to decide: it decides offline, and the popup after a refusal is only allowed shortly after the click. */
const AUTO_DECIDE_MS = 1000
/** How long to wait for the signature once the iframe took it: building and checking go over the network. */
const AUTO_SIGN_MS = 30000

/**
 * Sign without a window, if the user turned Auto sign on for this account —
 * the vault decides, not the app. Resolves null on any refusal: the caller
 * then opens the popup.
 */
export function requestAutoSignature(chain, actions) {
  const target = autoFrame?.contentWindow
  if (!target || !autoReady) return Promise.resolve(null)

  const reqId = crypto.randomUUID()

  return new Promise((resolve) => {
    let timer = setTimeout(() => finish(null), AUTO_DECIDE_MS)

    function finish(result) {
      window.removeEventListener('message', onMessage)
      clearTimeout(timer)
      resolve(result)
    }

    function onMessage(event) {
      if (event.origin !== VAULT_ORIGIN || event.source !== target || event.data?.reqId !== reqId) return

      if (event.data.type === 'vault:accepted') {
        clearTimeout(timer)
        timer = setTimeout(() => finish(null), AUTO_SIGN_MS)
        return
      }
      if (event.data.type !== 'vault:result') return

      const { ok, error, ...signed } = event.data
      finish(ok ? signed : null)
    }

    window.addEventListener('message', onMessage)
    target.postMessage({ type: 'vault:auto', reqId, chain, actions }, VAULT_ORIGIN)
  })
}

function request(payload) {
  const reqId = crypto.randomUUID()

  // A window name unique per request: with a fixed one the browser hands back
  // the window of the previous request, which never says `vault:ready` again.
  // Must run straight from the click, or the popup blocker eats the window.
  const popup = window.open(VAULT_ORIGIN, `alcor-sign-${reqId}`, 'width=440,height=720')

  if (!popup) {
    return Promise.reject(
      new VaultError('CONNECTION_FAILED', 'The browser blocked the signing window. Allow pop-ups for this site.')
    )
  }

  return new Promise((resolve, reject) => {
    let settled = false
    let answer

    const finish = (error, result) => {
      if (settled) return
      settled = true
      window.removeEventListener('message', onMessage)
      clearInterval(closeWatch)
      clearTimeout(handshake)
      clearTimeout(answer)
      error ? reject(error) : resolve(result)
    }

    function onMessage(event) {
      // The one check that matters here: who is talking. '*' is never used.
      if (event.origin !== VAULT_ORIGIN || event.source !== popup) return

      if (event.data?.type === 'vault:ready') {
        clearTimeout(handshake)
        popup.postMessage({ type: 'vault:request', reqId, appOrigin: location.origin, ...payload }, VAULT_ORIGIN)

        // Handshake done but no answer — the window is alive, the conversation
        // is not. Only for signing: login may create a new passkey with its 24
        // words, which honestly takes longer; `closeWatch` covers it.
        if (payload.kind === 'sign') {
          answer = setTimeout(
            () => finish(new VaultError('CONNECTION_FAILED', 'Alcor Signer did not answer. Close the window and try again.')),
            180000
          )
        }
        return
      }

      if (event.data?.type !== 'vault:result' || event.data.reqId !== reqId) return

      // `rejected`: the user said no. Without it something broke (a contract with no
      // ABI, an unknown key) — an error, not a refusal, and shown as one.
      const { ok, rejected, error, ...result } = event.data
      if (ok) finish(null, result)
      else if (rejected) finish(new VaultError('USER_REJECTED', error ?? 'Rejected in the signing window'))
      else finish(new VaultError('SIGN_FAILED', error ?? 'Alcor Signer could not sign this'))
    }

    // The vault says hello first. No hello: it is down, or it does not know this origin.
    const handshake = setTimeout(() => {
      finish(
        new VaultError(
          'CONNECTION_FAILED',
          `${VAULT_ORIGIN} did not answer. Is it running, and does it allow the origin ${location.origin}?`
        )
      )
    }, 10000)

    // A closed window is an answer too — otherwise the call hangs forever.
    const closeWatch = setInterval(() => {
      if (popup.closed) finish(new VaultError('USER_REJECTED', 'The signing window was closed'))
    }, 400)

    window.addEventListener('message', onMessage)
  })
}
