require('dotenv').config()

import crypto from 'node:crypto'

import express from 'express'
import { PublicKey } from '@wireio/sdk-core'

import config from '../../../config'
import { initRedis } from '../redis'
import { createWireSigner, reason } from './chain'
import { clientIp, exhausted, record, Limit } from './limits'

// Faucet for our own Wire testnet: it creates an account for a wallet key that
// has none, and hands out test tokens. Both are things a public chain gets from
// its own faucet and this one has to get from us — the chain admin key is the
// only thing that can create accounts or move the test supply, and it never
// leaves this process.
//
// Public entry point is nginx: /api/v2/wire-test/* -> 127.0.0.1:3100/*.
// The bind is loopback-only, which is also what makes X-Forwarded-For trustworthy.

const network: Network = config.networks[process.env.NETWORK || 'wiretest']

if (!network) throw new Error(`Unknown NETWORK: ${process.env.NETWORK}`)
if (!network.faucet) throw new Error(`No faucet configured for ${network.name}`)
if (!process.env.WIRE_TESTNET_KEY) {
  throw new Error(`WIRE_TESTNET_KEY is required — the WIF authorizing ${network.faucet.issuer}@active`)
}

const faucet = network.faucet
const windowMs = faucet.windowHours * 3600_000
const port = Number(process.env.PORT) || 3100

const signer = createWireSigner(
  `${network.protocol}://${network.host}:${network.port}`,
  process.env.WIRE_TESTNET_KEY
)

// Name alphabet of the `name` type, from the sysio.roa charmap.
const NAME_CHARS = '12345abcdefghijklmnopqrstuvwxyz'

/** Unique per issuer — a repeat fails with "Sponsor entry for this nonce already exists". */
function randomNonce(): string {
  return Array.from(crypto.randomBytes(12), (byte) => NAME_CHARS[byte % NAME_CHARS.length]).join('')
}

/**
 * `newuser` picks the account name itself, at execution time, so it cannot be
 * read out of the transaction that created it. The key is the only handle we
 * have on the new account until it lands.
 */
async function awaitAccountForKey(pubkey: string): Promise<string> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const account = await signer.accountForKey(pubkey)
    if (account) return account
    await new Promise((resolve) => setTimeout(resolve, 400))
  }

  throw new Error(`account for ${pubkey} never appeared`)
}

// Every write goes through one queue: concurrent requests would otherwise race
// over nonces, and two identical drips in one block serialize to the same
// transaction id and get rejected as duplicates.
let queue: Promise<any> = Promise.resolve()

function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(() => {}, () => {})
  return run
}

const app = express()
app.use(express.json({ limit: '4kb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, chain: network.name, issuer: faucet.issuer, funder: faucet.funder })
})

app.post('/register', (req, res) =>
  serialize(async () => {
    let pubkey: string
    try {
      pubkey = PublicKey.from(req.body?.pubkey).toString()
    } catch (e) {
      res.status(400).json({ error: 'a valid pubkey is required: PUB_ED_ / PUB_EM_ / PUB_K1_ / PUB_WA_' })
      return
    }

    const known = await signer.accountForKey(pubkey)
    if (known) {
      res.json({ account: known, pubkey, policy: true, created: false })
      return
    }

    const limits: Limit[] = [{ bucket: 'register-ip', id: clientIp(req), max: faucet.accountsPerIp }]
    const spent = await exhausted(limits, windowMs)
    if (spent) {
      res.status(429).json({ error: `limit of ${spent.max} accounts per IP per ${faucet.windowHours}h` })
      return
    }

    const nonce = randomNonce()
    try {
      await signer.push([
        await signer.action('sysio.roa', 'newuser', faucet.issuer, { creator: faucet.issuer, nonce, pubkey }),
      ])
    } catch (e) {
      res.status(502).json({ error: 'newuser failed', detail: reason(e) })
      return
    }

    const account = await awaitAccountForKey(pubkey)
    await record(limits, windowMs) // only a real account costs a slot

    // A second transaction: addpolicy takes the account name as an argument, and
    // that name did not exist when the first one was packed.
    try {
      await signer.push([
        await signer.action('sysio.roa', 'addpolicy', faucet.issuer, {
          owner: account,
          issuer: faucet.issuer,
          net_weight: faucet.policy.net,
          cpu_weight: faucet.policy.cpu,
          ram_weight: faucet.policy.ram,
          time_block: 0,
          network_gen: 0,
        }),
      ])
    } catch (e) {
      // The account exists and its name must not be lost, so this is reported
      // rather than thrown. Resources are fixed by hand with `expandpolicy`.
      console.error(`[faucet] addpolicy for ${account} failed: ${reason(e)}`)
      res.status(207).json({ account, pubkey, policy: false, created: true, detail: reason(e) })
      return
    }

    res.json({ account, pubkey, policy: true, created: true })
  }).catch((error) => {
    console.error(error)
    if (!res.headersSent) res.status(500).json({ error: reason(error) })
  })
)

app.post('/faucet', (req, res) =>
  serialize(async () => {
    const account = String(req.body?.account || '').trim()

    if (!/^[1-5a-z.]{1,12}$/.test(account)) {
      res.status(400).json({ error: 'a valid account name is required' })
      return
    }

    if (!(await signer.accountExists(account))) {
      res.status(404).json({ error: `account ${account} does not exist on ${network.name}` })
      return
    }

    const limits: Limit[] = [
      { bucket: 'faucet-account', id: account, max: faucet.dripsPerAccount },
      { bucket: 'faucet-ip', id: clientIp(req), max: faucet.dripsPerIp },
    ]

    const spent = await exhausted(limits, windowMs)
    if (spent) {
      res.status(429).json({
        error: `limit of ${spent.max} drips per ${spent.bucket === 'faucet-ip' ? 'IP' : 'account'} per ${faucet.windowHours}h`,
      })
      return
    }

    // One transaction for the whole batch: either the account gets every test
    // token or it gets none, and there is no half-funded state to reason about.
    const actions = await Promise.all(
      faucet.drip.map((token) =>
        signer.action(token.contract, 'transfer', faucet.funder, {
          from: faucet.funder,
          to: account,
          quantity: token.quantity,
          memo: `${network.desc} faucet`,
        })
      )
    )

    try {
      await signer.push(actions)
    } catch (e) {
      res.status(502).json({ error: 'transfer failed', detail: reason(e) })
      return
    }

    await record(limits, windowMs)

    res.json({ account, sent: faucet.drip.map((token) => token.quantity) })
  }).catch((error) => {
    console.error(error)
    if (!res.headersSent) res.status(500).json({ error: reason(error) })
  })
)

initRedis().then(() => {
  app.listen(port, '127.0.0.1', () => {
    console.log(`[faucet] ${network.name} on 127.0.0.1:${port} -> ${network.protocol}://${network.host}:${network.port}`)
    console.log(`[faucet] issuer ${faucet.issuer}, ${faucet.accountsPerIp} accounts per IP per ${faucet.windowHours}h`)
    console.log(`[faucet] funder ${faucet.funder}, drip ${faucet.drip.map((t) => t.quantity).join(' + ')}`)
  })
})
