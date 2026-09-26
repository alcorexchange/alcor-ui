/**
 * Alcor Signer logins remembered here, to survive a reload — the vault window
 * cannot be opened again without a click. A port of `lib/vault/sessions.ts` in
 * the new Alcor (perps_ui).
 *
 * Public data only: network, account, permission, passkey public key, signing
 * mode. None of it can sign anything; it is all on chain anyway.
 */

const KEY = 'alcor.vault.sessions'

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(sessions) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sessions))
  } catch {
    // Private window or full storage: login works, it just won't survive a reload.
  }
}

/** The latest login on this network. */
export function lastVaultSession(chain) {
  return read().find((session) => session.chain === chain) ?? null
}

/** Remember a login. Same account on the same network is one entry, newest first. */
export function rememberVaultSession(session) {
  write([session, ...read().filter((entry) => entry.chain !== session.chain || entry.account !== session.account)])
}

export function forgetVaultSession(chain, account) {
  write(read().filter((entry) => entry.chain !== chain || entry.account !== account))
}
