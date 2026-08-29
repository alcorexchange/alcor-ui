import { Settings } from '../../../models'
import { sleep } from '../../../utils'
import { getAccountAsKey, getStartingBlock } from '../../updaterService/streamers'
import type { ActionCallback } from '../types'

// Wire's trace_api can filter action traces server-side over a block range and
// hands back the ABI-decoded payload in `params`. That removes the two most
// fragile parts of the Antelope streamer: fetching a block at a time just to
// discard everything that is not ours, and decoding action data in JS against a
// locally cached ABI.

// The node clamps a request to `trace-max-block-range` (1000 by default) anyway,
// so asking for more only makes the clamp invisible.
const BLOCK_RANGE = Number(process.env.WIRE_TRACE_BLOCK_RANGE) || 1000

function normalizeAction(action: any) {
  // Shaped like an Antelope action trace, so the callbacks written for
  // streamByTrace keep working untouched.
  return {
    act: { account: action.account, name: action.name, data: action.params },
    receipt: { global_sequence: action.global_sequence, receiver: action.receiver },
    trx_id: action.trx_id,
    block_num: action.block_num,
    block_time: action.block_time,
  }
}

async function saveProgress(network: Network, account: string, blockNum: number) {
  const $set: any = {}
  $set[`last_block_num.${getAccountAsKey(account)}`] = blockNum

  await Settings.updateOne({ chain: network.name }, { $set })
}

async function resolveStartingBlock(network: Network, account: string, rpc: any): Promise<number> {
  try {
    return await getStartingBlock(network, account, rpc)
  } catch (e) {
    if (network.firstBlock === undefined) throw e

    if (network.firstBlock === 'head') {
      const { head_block_num: head } = await rpc.get_info()
      console.log(`[${network.name}:${account}] no saved progress, starting at head ${head}`)
      return head
    }

    console.log(`[${network.name}:${account}] no saved progress, starting at ${network.firstBlock}`)
    return network.firstBlock
  }
}

export async function streamByWireActions(
  network: Network,
  account: string,
  rpc: any,
  callback: ActionCallback,
  names: string[],
  delay = 500
): Promise<never> {
  const wanted = new Set(names)
  const matchAll = wanted.has('*')

  // trace_api takes a single action name, not a list, so the filter is by
  // contract only and the names are sifted here. One request per range beats
  // one request per action name on a chain this quiet.
  //
  // Note for the orderbook: this relies on include_notifications defaulting to
  // false, which pins receiver == account. Every AMM log action is an inline the
  // contract sends to itself, but a `transfer` NOTIFICATION from a token
  // contract would be filtered out and needs the flag turned on.
  let cursor = await resolveStartingBlock(network, account, rpc)

  console.info(`[${network.name}] Starting Wire trace streamer for ${account} at block ${cursor}`)

  while (true) {
    try {
      const requestedEnd = cursor + BLOCK_RANGE - 1

      const result = await rpc.fetch('/v1/trace_api/get_actions', {
        block_num_start: cursor,
        block_num_end: requestedEnd,
        account,
      })

      // The node reports the range it actually scanned, clamped to its own last
      // recorded block. `end < start` means nothing in the window is recorded
      // yet — retry the same start rather than skipping the window.
      const scannedTo = Number(result.block_num_end)

      if (!Number.isFinite(scannedTo) || scannedTo < cursor) {
        await sleep(delay)
        continue
      }

      for (const action of result.actions || []) {
        if (!matchAll && !wanted.has(action.name)) continue

        // No `params` means the node could not decode against the ABI it had at
        // execution time. Passing raw hex on to callbacks expecting an object
        // would corrupt state, so drop it loudly instead.
        if (action.params === undefined) {
          console.error(
            `[${network.name}:${account}] ${action.name} @${action.block_num} arrived undecoded, skipping.`,
            action.decode_error || ''
          )
          continue
        }

        await callback(normalizeAction(action), network)
      }

      // A short scan means we reached the head; a full one means we are still
      // catching up and should go straight into the next window.
      const caughtUp = scannedTo < requestedEnd

      cursor = scannedTo + 1
      await saveProgress(network, account, cursor)

      if (caughtUp) {
        await sleep(delay)
      } else {
        console.log(`[${network.name}:${account}] #${cursor} catching up`)
      }
    } catch (e) {
      console.log(`[${network.name}:${account}] trace_api error: ${e.message}`)
      await sleep(5000)
    }
  }
}
