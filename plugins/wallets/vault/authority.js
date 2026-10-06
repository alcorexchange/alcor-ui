import { PublicKey } from '@wharfkit/antelope'

/**
 * `updateauth` that adds a key next to what the permission already has. A port
 * of `lib/vault/authority.ts` in the new Alcor (perps_ui) — keep the two in step.
 *
 * Nothing is taken away: the account signs this with the wallet it already
 * has, and losing that wallet is the last thing "add a passkey" should do.
 */

/** Key type order in an authority, as the node has it: K1, R1, WA. */
const KEY_ORDER = { K1: 0, R1: 1, WA: 2 }

/** The key in its modern form: the node returns K1 as legacy `EOS…`. */
export const normalizeKey = (key) => String(PublicKey.from(key))

/**
 * The order the chain requires — anything else is "Invalid authority". The
 * node compares the keys, not strings: type, then 33 bytes of the point
 * unsigned, then for WA the presence byte and the rpid.
 */
function compareKeys(a, b) {
  const x = PublicKey.from(a)
  const y = PublicKey.from(b)
  const typeOrder = (KEY_ORDER[String(x.type)] ?? 99) - (KEY_ORDER[String(y.type)] ?? 99)
  if (typeOrder) return typeOrder

  const p = x.data.array
  const q = y.data.array
  for (let i = 0; i < 34; i++) if (p[i] !== q[i]) return (p[i] ?? -1) - (q[i] ?? -1)

  return compareBytes(rpidBytes(p), rpidBytes(q))
}

/** rpid inside a WA key: after the point and presence — a varuint32 length and the string. */
function rpidBytes(data) {
  let at = 34
  while (at < data.length && data[at] & 0x80) at++
  return data.subarray(at + 1)
}

function compareBytes(p, q) {
  for (let i = 0; i < Math.min(p.length, q.length); i++) if (p[i] !== q[i]) return p[i] - q[i]
  return p.length - q.length
}

/**
 * The rpid inside a `PUB_WA_` key — the domain the key belongs to. The only way
 * to tell our passkey from any other WebAuthn key: by prefix they look the same.
 *
 * @returns the rpid, or null for a non-WA key or one that does not parse
 */
export function keyRpid(key) {
  try {
    const parsed = PublicKey.from(key)
    if (String(parsed.type) !== 'WA') return null

    const raw = parsed.data.array
    let length = 0
    let shift = 0
    let at = 34

    for (;;) {
      const byte = raw[at++]
      if (byte === undefined) return null

      length |= (byte & 0x7f) << shift
      if ((byte & 0x80) === 0) break
      shift += 7
    }

    const rpid = new TextDecoder().decode(raw.slice(at, at + length))
    return rpid.length === length && rpid.length > 0 ? rpid : null
  } catch {
    return null
  }
}

function hasKey(authority, key) {
  const target = normalizeKey(key)
  return authority.keys.some((entry) => normalizeKey(entry.key) === target)
}

/** Whether the key signs for the permission alone: it is there and weighs at least the threshold. */
export function keySignsAlone(authority, key) {
  const target = normalizeKey(key)
  return authority.keys.some((entry) => normalizeKey(entry.key) === target && entry.weight >= authority.threshold)
}

/** Add keys to a permission, keeping everything else. */
export function addKeyAction(account, permission, parent, authority, added) {
  // Weight = threshold: an Alcor Signer key signs alone. With weight 1 on a
  // threshold-2 account (WAX Cloud Wallet) it would sit there signing nothing.
  const weight = authority.threshold
  const ours = new Set(added.map(normalizeKey))
  const fresh = [...ours].filter((key) => !hasKey(authority, key))
  const keys = [
    // Our key already there with a weight below the threshold — raise it.
    ...authority.keys.map((entry) => {
      const key = normalizeKey(entry.key)
      return { key, weight: ours.has(key) ? Math.max(entry.weight, weight) : entry.weight }
    }),
    ...fresh.map((key) => ({ key, weight })),
  ].sort((a, b) => compareKeys(a.key, b.key))

  return {
    account: 'eosio',
    name: 'updateauth',
    authorization: [{ actor: account, permission }],
    data: {
      account,
      permission,
      parent,
      auth: {
        threshold: authority.threshold,
        keys,
        // Delegations and waits carry over as they are: they are the account's
        // own arrangements, and "add a passkey" has no business with them.
        accounts: authority.accounts,
        waits: authority.waits,
      },
    },
  }
}
