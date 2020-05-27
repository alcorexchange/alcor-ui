const { convertLegacyPublicKeys } = require('eosjs/dist/eosjs-numeric')

class CosignAuthorityProvider {
  async getRequiredKeys(args) {
    const { transaction } = args
    transaction.actions.forEach((action, ti) => {
      action.authorization.forEach((auth, ai) => {
        if (
          auth.actor === 'greymassfuel' && auth.permission === 'cosign'
        ) {
          delete transaction.actions[ti].authorization.splice(ai, 1)
        }
      })
    })
    return convertLegacyPublicKeys((await rpc.fetch('/v1/chain/get_required_keys', {
      transaction,
      available_keys: args.availableKeys
    })).required_keys)
  }
}

// Pass in new authorityProvider
//const api = new Api({
//  authorityProvider: new CosignAuthorityProvider(),
//  // the rest of your configuration
//})
