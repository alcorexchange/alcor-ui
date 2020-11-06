import { JsonRpc, Api } from 'eosjs'

import ScatterJS from 'scatterjs-core'
import ScatterEOS from 'scatterjs-plugin-eosjs2'

let scatter
let accountPublickey
let signatureProvider

ScatterJS.plugins(new ScatterEOS())

// TODO: Ability to pass Scatter options
export function scatterWalletProvider() {
  return function makeWalletProvider(network) {
    async function connect(appName) {
      console.log('connecting 1')
      scatter = null
      const connected = await ScatterJS.scatter.connect(appName, { network })

      if (connected) {
        scatter = ScatterJS.scatter
        console.log('connecting 2, scatter: ', scatter)
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
      //scatter.logout()
      //scatter.forgetIdentity()
      //scatter.disconnect()

      console.log('logouted_2')

      try {
        console.log('scatter.logout..')
        return scatter.logout()
      } catch {
        return scatter.forgetIdentity()
      }
    }

    function signArbitrary(data, userMessage) {
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
          if (!signatureProvider) {
            if ('eosHook' in scatter) {
              console.log('sing using eosHook...')
              signatureProvider = scatter.eosHook({ ...network, blockchain: 'eos' }, null, true)
            } else {
              console.log('sing using eos object (old way)...')
              const jNetwork = ScatterJS.Network.fromJson({ ...network, blockchain: 'eos' })
              const rpc = new JsonRpc(jNetwork.fullhost())
              const eos = scatter.eos(network, Api, { rpc })

              signatureProvider = eos.signatureProvider
            }
          }

          return signatureProvider.sign(signatureProviderArgs)
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
