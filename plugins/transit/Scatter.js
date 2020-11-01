import ScatterJS from '@scatterjs/core'
import ScatterEOS from '@scatterjs/eosjs2'

const scatter = ScatterJS
let accountPublickey

scatter.plugins(new ScatterEOS())

export function makeSignatureProvider(network) {
  // 3rd param: beta3 = true
  return scatter.eosHook({ ...network, blockchain: 'eos' }, null, true)
}

// TODO: Ability to pass Scatter options
export function scatterWalletProvider() {
  return function makeWalletProvider(network) {
    // Connection

    function connect(appName) {
      return scatter
        .connect(appName, { initTimeout: 10000 })
        .then((connected) => {
          if (connected) return true
          return Promise.reject('Cannot connect to Scatter')
        })
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
      // TODO: Uncomment when Scatter implements this correctly
      // (probably by using `socket.close()` instead of `socket.disconnect()`)
      scatter.disconnect()
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
      return scatter.forgetIdentity()
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
      signatureProvider: makeSignatureProvider(network),
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
