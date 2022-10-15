// NO HAVY LOGIC HERE (runs each request)
import fetch from 'node-fetch'
import { io } from 'socket.io-client'
import { isEmpty } from 'lodash'

import { JsonRpc } from 'eosjs'
import { shuffleArray } from '../utils'

import { JsonRpc as JsonRpcMultiEnds } from '~/assets/libs/eosjs-jsonrpc'

import config from '~/config'
import * as fundamentals from '~/assets/fundamentals'

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export default ({ app: { store: { state, commit }, $axios }, req }, inject) => {
  if (process.env.DISABLE_DB) {
    if (!process.env.NETWORK) throw new Error('Set NETWORK env!')
    const subdomain = process.env.NETWORK == 'wax' ? '' : process.env.NETWORK + '.'

    commit('setBaseUrl', `https://${subdomain}alcor.exchange`)
    commit('setNetwork', config.networks[process.env.NETWORK])

    global.CURRENT_REQUEST_NETWORK = state.network.name
  } else if (process.server) {
    const protocol = process.env.isDev ? 'http' : 'https'
    commit('setBaseUrl', `${protocol}://${req.headers.host}`)

    const subdomain = req.headers.host.split('.')

    if (process.env.NETWORK) {
      commit('setNetwork', config.networks[process.env.NETWORK])
    } else if (IP_REGEX.test(req.headers.host)) {
      commit('setNetwork', config.networks.eos)
    } else if (subdomain.length <= 2) {
      commit('setNetwork', config.networks.wax)
    } else {
      commit('setNetwork', config.networks[subdomain[0]])
    }

    //global.CURRENT_REQUEST_NETWORK = state.network.name
  }

  global.CURRENT_REQUEST_NETWORK = 'LOLOLOLO'

  $axios.setBaseURL(state.baseUrl.replace('https', 'http') + '/api')

  inject('fundamentals', fundamentals)

  if (process.client) {
    // Тут RPC с возможностью менять эндпоинт
    const socket = io(
      (process.env.isDev && !process.env.DISABLE_DB)
        ? 'localhost:7002' : state.baseUrl, { transports: ['websocket'] }
    )

    const all_nodes = Object.keys(state.network.client_nodes)
    shuffleArray(all_nodes)
    all_nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

    const rpc = new JsonRpcMultiEnds(all_nodes, { fetch })

    // Trying to implement node selection. (anchorLink is not use jsonrpc from eosjs so not possible for now)
    //if (isEmpty(state.settings.rpc_nodes)) commit('settings/setRpcNodes', state.network.client_nodes)

    //let rpc
    //const nodes = []
    //if (state.settings.auto_node_select || !state.settings.current_node) {

    //  if (!state.settings.auto_node_select && !state.settings.current_node) {
    //    commit('settings/setAutoNodeSelect', true)
    //  }

    //  const all_nodes = Object.keys(state.settings.rpc_nodes)
    //  shuffleArray(all_nodes)
    //  all_nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

    //  nodes.push(...all_nodes)
    //  console.log('nodes', nodes)
    //  rpc = new JsonRpcMultiEnds(nodes, { fetch })
    //} else {
    //  rpc = new JsonRpc(state.settings.current_node, { fetch })
    //}

    inject('socket', socket)
    inject('rpc', rpc)
  }

  if (process.server) {
    const rpc = new JsonRpc(state.network.protocol + '://' + state.network.host + ':' + state.network.port, { fetch })
    inject('rpc', rpc)
  }

  // TODO
  //sitemap generation
  //routes: async () => {
  //  const { data: pairs } = await axios.get('https://alcor.exchange/api/v2/pairs')
  //  return pairs.map(pair => `/trade/${pair.ticker_id}`)
  //},


}
