import { performance } from 'perf_hooks'
import fetch from 'cross-fetch'
import { JsonRpc } from 'enf-eosjs'

import { Match, Settings } from '../../models'
import { getSettings } from '../../utils'

function getAccountAsKey(account: string) {
  return account.replace('.', '-')
}

export async function streamByGreymass(network, account, callback, actions, delay = 500) {
  console.info(`Start NODE updater for ${network.name} (${account})...`)

  // Здесь мы юзаем свой _skip так как в коде обработки экшена он думает что там будет хайпирион скип
  const rpc = new JsonRpc(`${network.protocol}://${network.host}:${network.port}`, { fetch })
  const settings = await getSettings(network)

  let offset = settings.actions_stream_offset[getAccountAsKey(account)] || 0
  //let offset = 0

  // TODO короче тестить это все дерьмо с настройками
  console.log('start fetching actions by node from', offset, 'for', network.name, '(' + account + ')')
  while (true) {
    let r
    try {
      const startTime = performance.now()
      r = await rpc.history_get_actions(account, offset, 100)
      const endTime = performance.now()
      if (r.actions.length > 0) {
        console.log(`receive actions(${network.name}, ${account}): ${r.actions.length} -> ${Math.round(endTime - startTime)}ms`)
      }
    } catch (e) {
      // TODO Почему то не срабатывает перезапуск при ошибке сети или днс
      console.log(`getActionsByNode(${network.name}) err: `, e.message)
      await new Promise((resolve, reject) => setTimeout(resolve, delay))
      continue
    }

    for (const a of r.actions.map(a => a.action_trace)) {
      offset += 1

      if (actions.includes(a.act.name)) {
        await callback(a, network)
      }
    }

    const $set = {}

    // MongoDB does not support . in keys, so we have to convert it using getAccountAsKey
    $set[`actions_stream_offset.${getAccountAsKey(account)}`] = offset
    //$set[`actions_stream_last_block_num.${getAccountAsKey(account)}`] = offset

    await Settings.updateOne({ chain: network.name }, { $set })

    if (r.actions.length < 100) {
      //console.log(`waitForNewActions(${network.name}, ${account})...`)
      await new Promise((resolve, reject) => setTimeout(resolve, delay))
    }
  }
}

export async function streamByHyperion(
  network: any,
  account: string,
  callback: Function,
  actions: string[],
  delay: number = 1000
) {
  console.info(`Start Hyperion updater for ${network.name} (${account})...`)

  const settings = await getSettings(network)

  let skip: number = settings.actions_stream_offset[getAccountAsKey(account)] || 0

  console.log('start fetching actions by Hyperion from', skip, 'for', network.name, `(${account})`)

  while (true) {
    let data: any

    try {
      const startTime = performance.now()

      // Build the Hyperion API URL
      const url = `${network.hyperion}/v2/history/get_actions?limit=100&skip=${skip}&account=${account}&sort=-1`
      console.log({ url })

      // Fetch the data from Hyperion
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      // Parse the response as JSON
      data = await response.json()

      const endTime = performance.now()

      if (data.actions.length > 0) {
        console.log(
          `Received actions(${network.name}, ${account}): ${data.actions.length} -> ${Math.round(
            endTime - startTime
          )}ms`
        )
      }
    } catch (e) {
      console.log(`getActionsByHyperion(${network.name}) err: `, e.message)
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }

    for (const action of data.actions) {
      skip += 1

      // Hyperion stores the actual action data under `act`
      if (actions.includes(action.act.name)) {
        await callback(action, network)
      }
    }

    const $set: { [key: string]: any } = {}
    $set[`actions_stream_offset.${getAccountAsKey(account)}`] = skip

    await Settings.updateOne({ chain: network.name }, { $set })

    if (data.actions.length < 100) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}
