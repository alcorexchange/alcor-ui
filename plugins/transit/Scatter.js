import { Api } from 'eosjs'


import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'
//import ScatterEOS from '~/assets/libs/scatter-plugin2'

let scatter_plugin = null
let scatter_api = null

const getScatter = () => scatter_api || scatter_plugin

let accountPublickey
let signatureProvider

ScatterJS.plugins(new ScatterEOS())

if (typeof window !== 'undefined' || typeof document !== 'undefined') {
  document.addEventListener('scatterLoaded', () => {
    console.log('scatter connect in hook')
    scatter_plugin = window.scatter
  })
}

// TODO: Ability to pass Scatter options
export function scatterWalletProvider() {
  return function makeWalletProvider(network) {
    async function connect(appName) {
      //return new Promise((resolve, reject) => {
      //  let tries = 0

      //  function checkConnect() {
      //    if (scatter) return resolve(true)

      //    tries++

      //    if (tries > 5) return reject('Cannot connect to ScatterPocket wallet provider')

      //    setTimeout(() => {
      //      checkConnect()
      //    }, 1000)
      //  }

      //  checkConnect()
      //})

      const scatter = getScatter()
      if (scatter && await scatter.isConnected()) return true

      const connected = await ScatterJS.scatter.connect(appName, { network })

      if (connected) {
        scatter_api = ScatterJS.scatter
        return true
      } else {
        throw new Error('Cannot connect to Scatter')
      }
    }

    function discover(discoveryOptions) {
      // console.log('in scatter discover.');
      return new Promise((resolve, reject) => {
        const discoveryInfo = {
          keys: [],
          note: 'Scatter does not support discovery'
        }

        resolve(discoveryInfo)
      })
    }

    function disconnect() {
      const scatter = getScatter()
      try {
        //scatter.disconnect()
      } catch {
        console.log('fail disconnect, try forgetIdentity... scatter: ', scatter)
        scatter.forgetIdentity()
      }

      return Promise.resolve(true)
    }

    // Authentication

    async function login(accountName) {
      const scatter = getScatter()
      try {
        await scatter.checkLogin()
      } catch (e) {
        console.log('check login err', e)
      }

      try {
        // Useful for testnets to provide a convenient means for the end use to quickly add
        // the required network configuration to their Scatter seamlessly while logging in.
        await scatter.suggestNetwork({ ...network, blockchain: 'eos' })

        const identity = await scatter.getIdentity({
          accounts: [{ ...network, blockchain: 'eos' }]
        })

        if (!identity) {
          return Promise.reject('No identity obtained from Scatter')
        }

        const account =
          (identity &&
            identity.accounts &&
            identity.accounts.find((x) => x.blockchain === 'eos')) || undefined

        if (!account) {
          return Promise.reject(
            'No account data obtained from Scatter identity'
          )
        }

        accountPublickey = account.publicKey

        return {
          accountName: account.name,
          permission: account.authority,
          publicKey: accountPublickey
        }
      } catch (error) {
        console.log('[scatter]', error)
        return Promise.reject(error)
      }
    }

    function logout(accountName) {
      const scatter = getScatter()

      try {
        return scatter.logout()
      } catch {
        return scatter.forgetIdentity()
      }
    }

    function signArbitrary(data, userMessage) {
      const scatter = getScatter()

      return scatter.getArbitrarySignature(accountPublickey, data, userMessage)
    }

    const walletProvider = {
      id: 'scatter',
      meta: {
        name: 'Scatter Desktop',
        shortName: 'Scatter',
        description:
          'Scatter Desktop application that keeps your private keys secure'
      },
      signatureProvider: {
        getAvailableKeys() {
          return [accountPublickey]
        },

        sign(signatureProviderArgs) {
          const scatter = getScatter()

          if (!signatureProvider) {
            if ('eosHook' in scatter) {
              console.log('sing using eosHook...', scatter)
              console.log(2)
              signatureProvider = scatter.eosHook({ ...network, blockchain: 'eos' }, null, true)
            } else {
              console.log('sing using eos object (old way)...')
              const jNetwork = ScatterJS.Network.fromJson({ ...network, blockchain: 'eos' })
              const rpc = new JsonRpc(jNetwork.fullhost())
              const eos = scatter.eos(jNetwork, Api, { rpc })

              signatureProvider = eos.signatureProvider
            }
          }

          return signatureProvider.sign(signatureProviderArgs)
        }
      },
      getEosApi() {
        if (scatter_api) {
          return undefined
        } else if (scatter_plugin) {
          const jNetwork = ScatterJS.Network.fromJson({ ...network, blockchain: 'eos' })
          const rpc = new JsonRpc(jNetwork.fullhost())
          return scatter_plugin.eos(jNetwork, Api, { rpc })
        } else {
          return undefined
        }
      },
      connect,
      discover,
      disconnect,
      login,
      logout,
      signArbitrary
    }

    return walletProvider
  }
}

export default scatterWalletProvider
