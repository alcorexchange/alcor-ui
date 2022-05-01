import fetch from 'node-fetch'
import { io } from 'socket.io-client'

import { JsonRpc } from 'eosjs'
import { shuffleArray } from '../utils'

import { JsonRpc as JsonRpcMultiEnds } from '~/assets/libs/eosjs-jsonrpc'

import config from '~/config'

const IP_REGEX = RegExp(/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$/)

export default ({ app: { store: { rootState, state, commit }, $axios }, req }, inject) => {
  if (process.env.DISABLE_DB) {
    if (!process.env.NETWORK) throw new Error('Set NETWORK env!')
    const subdomain = process.env.NETWORK == 'wax' ? '' : process.env.NETWORK + '.'

    commit('setBaseUrl', `https://${subdomain}alcor.exchange`)
    commit('setNetwork', config.networks[process.env.NETWORK])
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
  }

  $axios.setBaseURL(state.baseUrl.replace('https', 'http') + '/api')

  if (process.client) {
    // Тут RPC с возможностью менять эндпоинт
    const socket = io(
      (process.env.isDev && !process.env.DISABLE_DB)
        //? 'localhost:7002' : state.baseUrl
        ? 'localhost:7002' : state.baseUrl, { transports: ['websocket'] }
    )

    // Managing nodes
    if (rootState.settings.rpc_nodes.length == 0) {
      commit('settings/setRpcNodes', Object.keys(state.network.client_nodes))
    }

    const nodes = []
    if (state.settings.auto_node_select || !state.settings.current_node) {
      if (!state.settings.auto_node_select && !state.settings.current_node) {
        commit('settings/setAutoNodeSelect', true)

        //this._vm.$notify({
        //  ...notify_options,
        //  title: `Order match - ${market.symbol}`,
        //  message: `${match.bid} ${market.quote_token.symbol.name} at ${match.price}`,
        //  type: 'success'
        //})

        // Notification
        // TODO Set current node
        //commit('settings')
      }

      const all_nodes = state.settings.rpc_nodes
      shuffleArray(all_nodes)
      all_nodes.sort((a, b) => a.includes('alcor') ? -1 : 1)

      nodes.push(...all_nodes)
    } else {
      nodes.push(state.settings.current_node)
    }

    const rpc = new JsonRpcMultiEnds(nodes, { fetch })

    inject('socket', socket)
    inject('rpc', rpc)
  }

  if (process.server) {
    const rpc = new JsonRpc(state.network.protocol + '://' + state.network.host + ':' + state.network.port, { fetch })
    inject('rpc', rpc)
  }
}
