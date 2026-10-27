import { ABIEncoder, Base58, KeyType, PublicKey, Signature } from '@wireio/sdk-core'

// A wallet hands the frontend a key in the shape of its own ecosystem: MetaMask
// has nothing but an address until something is signed, Phantom has base58, a
// passkey has an SPKI blob and the domain it is bound to. None of that is a Wire
// key, and the conversion is the same for every frontend — so it happens here,
// once, instead of in each of them.
//
// A signature is optional everywhere except the EVM-address case, where it is
// the only way back to the key at all. When one is sent it is checked, and a key
// the caller cannot sign for is refused.

/** A malformed request: reported as 400, not logged as a crash. */
export class BadKey extends Error {}

export type Source = 'wire' | 'evm' | 'solana' | 'passkey'

export type KeyRequest = {
  /** Wire key, EVM public key hex, Solana base58 key, or a passkey's SPKI blob. */
  pubkey?: string
  /** Plain text the wallet was asked to sign. */
  message?: string
  /** Signature over `message` — hex from EVM wallets, base58 or hex from Solana. */
  signature?: string
  /** Domain the passkey is bound to. Part of the key itself, hence required for it. */
  rpId?: string
  /** Which user check the passkey performed: `none`, `present` or `verified`. */
  presence?: string
}

export type ResolvedKey = {
  /** The key in the form nodeop parses. */
  pubkey: string
  /** Wallet family it came from — for the response and the log. */
  source: Source
}

/** `user_presence_t` of the WebAuthn key, in the chain's own order. */
const PRESENCE: Record<string, number> = { none: 0, present: 1, verified: 2 }

/** An SPKI-wrapped P-256 key: this many header bytes, then the 65-byte point. */
const SPKI_P256_HEADER = 26

const SOURCE: Record<string, Source> = {
  [KeyType.EM]: 'evm',
  [KeyType.ED]: 'solana',
  [KeyType.WA]: 'passkey',
}

export function resolveKey(body: KeyRequest): ResolvedKey {
  const pubkey = text(body.pubkey)
  const message = text(body.message)
  const signature = text(body.signature)
  const rpId = text(body.rpId)

  // A key that is already a Wire key stays one, whatever else was sent with it.
  if (isWireKey(pubkey)) return proved(wireKey(pubkey), message, signature)

  if (rpId) return resolved(passkeyKey(pubkey, rpId, text(body.presence) || 'present'))

  // An Ethereum address is `keccak(pubkey)[12:]`, and that is one-way: without a
  // signature there is nothing on the EVM side to turn into a key.
  if (!pubkey) {
    if (!signature) {
      throw new BadKey(
        'send one of: pubkey (PUB_ED_ / PUB_EM_ / PUB_K1_ / PUB_WA_, EVM hex, Solana base58), ' +
          'message + signature for an EVM wallet, or pubkey + rpId for a passkey'
      )
    }

    return resolved(recoverEvm(message, signature))
  }

  return proved(walletKey(pubkey), message, signature)
}

function resolved(key: PublicKey): ResolvedKey {
  return { pubkey: nodeString(key), source: SOURCE[key.type] || 'wire' }
}

/**
 * The form nodeop parses. Only WA differs from the SDK's own `toString()`: that
 * one prints the key as hex and the node answers `Unable to decode base58
 * string` — fc knows a WebAuthn key only in the base58+checksum form the other
 * types use.
 */
function nodeString(key: PublicKey): string {
  if (key.type !== KeyType.WA) return key.toString()
  return `PUB_WA_${Base58.encodeRipemd160Check(key.data, KeyType.WA)}`
}

function isWireKey(pubkey: string): boolean {
  return pubkey.startsWith('PUB_') || (pubkey.startsWith('SYS') && pubkey.length >= 50)
}

function wireKey(pubkey: string): PublicKey {
  try {
    return PublicKey.from(pubkey)
  } catch (e) {
    throw new BadKey(`${pubkey} is not a valid Wire key`)
  }
}

/** A key in the encoding its own wallet ecosystem uses: EVM hex or Solana base58. */
function walletKey(pubkey: string): PublicKey {
  if (/^(0x)?[0-9a-f]+$/i.test(pubkey)) {
    const point = hexBytes(pubkey)

    if (point.length === 20) {
      throw new BadKey('that is an ethereum address, not a public key — send message + signature instead')
    }

    return PublicKey.from({ type: KeyType.EM, compressed: compressPoint(point, 'secp256k1') })
  }

  let key: Uint8Array
  try {
    key = Base58.decode(pubkey).array
  } catch (e) {
    throw new BadKey(`${pubkey} is not a Wire key, an EVM public key in hex, or a Solana key in base58`)
  }

  if (key.length !== 32) throw new BadKey(`a solana public key is 32 bytes, got ${key.length}`)

  return PublicKey.from({ type: KeyType.ED, compressed: key })
}

/**
 * The key of a passkey credential: the P-256 point from `getPublicKey()`, plus
 * the two things the chain keeps alongside it — which user check the
 * authenticator performed and which domain it is bound to.
 */
function passkeyKey(pubkey: string, rpId: string, presence: string): PublicKey {
  if (!pubkey) throw new BadKey('pubkey is required: the credential key from getPublicKey()')

  if (!/^[a-z0-9.-]{1,253}$/i.test(rpId)) throw new BadKey(`rpId ${rpId} is not a domain`)

  const user = PRESENCE[presence]
  if (user === undefined) {
    throw new BadKey(`presence must be one of: ${Object.keys(PRESENCE).join(', ')}`)
  }

  let key = anyBytes(pubkey, 'base64')
  if (key.length === SPKI_P256_HEADER + 65) key = key.subarray(SPKI_P256_HEADER)

  const encoder = new ABIEncoder()
  encoder.writeArray(compressPoint(key, 'p256'))
  encoder.writeByte(user)
  encoder.writeString(rpId)

  return PublicKey.from({ type: KeyType.WA, compressed: encoder.getData() })
}

/** The key `personal_sign` was made with — the only way back from an address. */
function recoverEvm(message: string, signature: string): PublicKey {
  if (!message) throw new BadKey('message is required: the text the wallet signed')

  const raw = hexBytes(signature)
  if (raw.length !== 65) throw new BadKey(`personal_sign returns 65 bytes, got ${raw.length}`)

  // 27/28 is the EIP-191 convention, 0/1 the bare recovery id some wallets return.
  const recovery = raw[64] < 27 ? raw[64] + 27 : raw[64]
  if (recovery !== 27 && recovery !== 28) {
    throw new BadKey(`recovery byte ${raw[64]} is neither 0/1 nor 27/28`)
  }

  raw[64] = recovery

  try {
    return Signature.fromRaw(raw, KeyType.EM).recoverMessage(utf8(message))
  } catch (e) {
    throw new BadKey(`the signature does not recover a key: ${e.message}`)
  }
}

/** The key, once the signature sent with it — if any — has been checked. */
function proved(key: PublicKey, message: string, signature: string): ResolvedKey {
  if (!signature) return resolved(key)
  if (!message) throw new BadKey('message is required alongside signature: the text the wallet signed')

  if (key.type === KeyType.EM) {
    if (!recoverEvm(message, signature).equals(key)) {
      throw new BadKey('the signature was made with a different key')
    }

    return resolved(key)
  }

  if (key.type === KeyType.ED) {
    const raw = anyBytes(signature, 'base58')
    if (raw.length !== 64) throw new BadKey(`an ed25519 signature is 64 bytes, got ${raw.length}`)

    if (!Signature.fromRaw(raw, KeyType.ED).verifyMessage(utf8(message), key)) {
      throw new BadKey('the signature does not match the key')
    }

    return resolved(key)
  }

  throw new BadKey(`a ${key.type} key cannot be checked against a signature here — send it without one`)
}

/** Wire keeps only the compressed point, whichever form the wallet handed over. */
function compressPoint(point: Uint8Array, curve: string): Uint8Array {
  if (point.length === 33 && (point[0] === 2 || point[0] === 3)) return point

  if (point.length === 65 && point[0] === 4) {
    const compressed = new Uint8Array(33)
    compressed[0] = 2 + (point[64] & 1) // the parity of y is all the short form keeps
    compressed.set(point.subarray(1, 33), 1)
    return compressed
  }

  throw new BadKey(`expected a 33- or 65-byte ${curve} public key, got ${point.length} bytes`)
}

function text(value: any): string {
  return typeof value === 'string' ? value.trim() : ''
}

function utf8(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'utf8'))
}

function hexBytes(value: string): Uint8Array {
  const hex = value.replace(/^0x/i, '')
  if (hex.length % 2 || !/^[0-9a-f]*$/i.test(hex)) throw new BadKey(`${value} is not hex`)
  return new Uint8Array(Buffer.from(hex, 'hex'))
}

function base58Bytes(value: string): Uint8Array {
  try {
    return Base58.decode(value).array
  } catch (e) {
    throw new BadKey(`${value} is not base58`)
  }
}

function base64Bytes(value: string): Uint8Array {
  if (!/^[a-z0-9_+/=-]+$/i.test(value)) throw new BadKey(`${value.slice(0, 16)}… is not base64`)
  return new Uint8Array(Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64'))
}

/**
 * Hex, or the encoding the value's own ecosystem uses — base58 around Solana,
 * base64url around WebAuthn. Sniffing all three at once would be a coin flip on
 * the strings that are valid in two of them.
 */
function anyBytes(value: string, alt: 'base58' | 'base64'): Uint8Array {
  if (/^(0x)?([0-9a-f]{2})+$/i.test(value)) return hexBytes(value)
  return alt === 'base58' ? base58Bytes(value) : base64Bytes(value)
}
