import { getMultyEndRpc } from '../utils/eosjs'

import config from '~/config'

import WCW from '~/plugins/wallets/WCW'
import AnchoWallet from '~/plugins/wallets/Anchor'
import ProtonWallet from '~/plugins/wallets/Proton'
import ScatterWallet from '~/plugins/wallets/Scatter'
import WombatWallet from '~/plugins/wallets/Wombat'

export const state = () => ({
  loginPromise: null,
  wallet: {},
  wallets: {},

  payForUser: false,
  lastWallet: null,
  loginContext: null
})

export const mutations = {
  setWallet: (state, wallet) => state.wallet = wallet,
  setWallets: (state, value) => (state.wallets = value),
  setLoginPromise: (state, value) => (state.loginPromise = value),
  setPayForUser: (state, value) => (state.payForUser = value),
  setLastWallet: (state, value) => (state.lastWallet = value),
  setLoginContext: (state, value) => state.loginContext = value
}

export const actions = {
  init({ state, commit, dispatch, rootState, rootGetters, getters }) {
    const wallets = {
      anchor: AnchoWallet,
      scatter: ScatterWallet,
      wcw: WCW,
      proton: ProtonWallet,
      wombat: WombatWallet
    }

    commit('setWallets', wallets)

    if (state.lastWallet) {
      commit('setWallet', new state.wallets[state.lastWallet](rootState.network, this.$rpc))
      dispatch('autoLogin')
    }
  },

  async autoLogin({ state, rootState, dispatch, commit, getters }) {
    // TODO Check correct chain
    console.log('try autoLogin..')
    const loginned = await state.wallet.checkLogin()
    if (loginned) {
      console.log('YES. autoLogining...')
      const { name, authorization, chainId } = loginned
      if (chainId !== rootState.network.chainId) return console.log('autoLogin chain mismatch')
      commit('setUser', { name, authorization }, { root: true })
      dispatch('afterLoginHook')

      return true
    }
    return false
  },

  afterLoginHook({ dispatch, rootState }) {
    dispatch('amm/init', {}, { root: true })

    dispatch('loadAccountData', {}, { root: true })

    dispatch('loadUserBalances', {}, { root: true }).then(() =>
      dispatch('market/updatePairBalances', {}, { root: true })
    )
    dispatch('loadAccountLimits', {}, { root: true })
      .then(() => dispatch('loadUserOrders', {}, { root: true }))
      .then(() => {
        this._vm.$nuxt.$emit('loadUserOrdersFinish')
      })

    dispatch('loadOrders', rootState.market.id, { root: true })

    this.$socket.emit('subscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name
      }
    })
  },

  logout({ state, dispatch, commit, getters, rootState }) {
    console.log('logout..')
    state.wallet.logout()
    commit('setLastWallet', null)
    this.$socket.emit('unsubscribe', {
      room: 'account',
      params: {
        chain: rootState.network.name,
        name: rootState.user.name
      }
    })

    commit('setUser', null, { root: true })
    commit('setUserOrders', [], { root: true })
  },

  async mainLogin({ commit, dispatch }) {
    try {
      const { wallet, name, authorization } = await dispatch('asyncLogin')

      commit('setWallet', wallet)

      const wasAutoLoginned = await dispatch('autoLogin')
      if (wasAutoLoginned) return commit('setLastWallet', wallet.name)

      commit('setUser', { name, authorization }, { root: true })
      dispatch('afterLoginHook')

      commit('setLastWallet', wallet.name)

      return wallet
    } catch (e) {
      this._vm.$notify({ type: 'warning', title: 'Wallet connect', message: e })
    }
  },

  async login({ state, commit, dispatch, getters, rootState }, wallet_name) {
    const network = state.loginContext?.chain ? config.networks[state.loginContext.chain] : rootState.network

    const wallet = new state.wallets[wallet_name](network, getMultyEndRpc(Object.keys(network.client_nodes)))

    try {
      const { name, authorization } = await wallet.login()
      state.loginPromise.resolve({ wallet, name, authorization })
    } catch (e) {
      state.loginPromise.reject(e)
    }
  },

  transfer({ dispatch, rootState }, { contract, actor, quantity, memo, to }) {
    return dispatch('sendTransaction', [
      {
        account: contract,
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: actor,
          to: to || rootState.network.contract,
          quantity,
          memo
        }
      }
    ])
  },

  async cancelorder(
    { dispatch, rootState },
    { contract, account, market_id, type, order_id }
  ) {
    const r = await dispatch('sendTransaction', [
      {
        account: contract || rootState.network.contract,
        name: `cancel${type}`,
        authorization: [rootState.user.authorization],
        data: { executor: account, market_id, order_id }
      }
    ])

    setTimeout(() => dispatch('loadOrders', market_id, { root: true }), 1000)
    return r
  },

  async asyncLogin({ rootState, commit, dispatch }, context) {
    if (context) commit('setLoginContext', context)

    const loginPromise = new Promise((resolve, reject) => {
      commit('setLoginPromise', { resolve, reject })
      dispatch('modal/login', null, { root: true })
    })

    try {
      return await loginPromise
    } catch (e) {
      throw new Error(e)
    } finally {
      if (context) commit('setLoginContext', null)
    }
  },

  async generateGiftLink({ rootState, dispatch }, { memo, asset_ids }) {
    const actions = [
      {
        account: 'atomictoolsx',
        name: 'announcelink',
        authorization: [rootState.user.authorization],
        data: {
          creator: rootState.user.name,
          key: rootState.account.permissions[0].required_auth.keys[0].key,
          asset_ids,
          memo: ''
        }
      },
      {
        account: 'atomicassets',
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: rootState.user.name,
          to: 'atomictoolsx',
          asset_ids,
          memo: 'link'
        }
      }
    ]

    return await dispatch('sendTransaction', actions)
  },

  async cancelBuyOffers({ rootState, dispatch }, offers) {
    try {
      const cancelActions = offers.map(([buyoffer_id]) => ({
        account: 'atomicmarket',
        name: 'cancelbuyo',
        authorization: [rootState.user.authorization],
        data: { buyoffer_id }
      }))
      const withdrawActions = offers.map(([_, amount]) => ({
        account: 'atomicmarket',
        name: 'withdraw',
        authorization: [rootState.user.authorization],
        data: {
          owner: rootState.user.name,
          token_to_withdraw: (+amount / 100000000).toFixed(8) + ' WAX'
        }
      }))

      return await dispatch('sendTransaction', [
        ...cancelActions,
        ...withdrawActions
      ])
    } catch (e) {
      console.error('Cancel Offers Error', e)
    }
  },
  async cancelOffers({ rootState, dispatch }, offers) {
    try {
      const actions = offers.map((offer_id) => ({
        account: 'atomicassets',
        name: 'canceloffer',
        authorization: [rootState.user.authorization],
        data: { offer_id }
      }))

      return await dispatch('sendTransaction', actions)
    } catch (e) {
      console.error('Cancel Offers Error', e)
    }
  },

  async transferNft({ rootState, dispatch }, { memo, reciever, asset_ids }) {
    const actions = [
      {
        account: 'atomicassets',
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: rootState.user.name,
          to: reciever,
          asset_ids,
          memo
        }
      }
    ]
    return await dispatch('sendTransaction', actions)
  },

  async cancelList({ state, rootState, dispatch }, { currentListing }) {
    const actions = [
      {
        account: 'atomicmarket',
        name: 'cancelsale',
        authorization: [rootState.user.authorization],
        data: {
          sale_id: currentListing
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  async cancelGifts({ rootState, dispatch }, gifts) {
    const actions = gifts.map(({ link_id }) => ({
      account: 'atomictoolsx',
      name: 'cancellink',
      authorization: [rootState.user.authorization],
      data: {
        link_id
      }
    }))

    await dispatch('sendTransaction', actions)
  },

  async cancelAuction({ state, rootState, dispatch }, { currentListing }) {
    const actions = [
      {
        account: 'atomicmarket',
        name: 'cancelauct',
        authorization: [rootState.user.authorization],
        data: {
          auction_id: currentListing
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  async burn({ state, rootState, dispatch }, asset_id) {
    const actions = [
      {
        account: 'atomicassets',
        name: 'burnasset',
        authorization: [rootState.user.authorization],
        data: {
          asset_owner: rootState.user.name,
          asset_id
        }
      }
    ]

    await dispatch('sendTransaction', actions)
  },

  async back({ state, rootState, dispatch }, { asset_id, amount }) {
    const actions = [
      {
        account: 'atomicassets',
        name: 'announcedepo',
        authorization: [rootState.user.authorization],
        data: {
          owner: rootState.user.name,
          symbol_to_announce: '8,WAX'
        }
      },
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: rootState.user.name,
          to: 'atomicassets',
          quantity: amount + ' WAX',
          memo: 'deposit'
        }
      },
      {
        account: 'atomicassets',
        name: 'backasset',
        authorization: [rootState.user.authorization],
        data: {
          payer: rootState.user.name,
          asset_owner: rootState.user.name,
          asset_id,
          token_to_back: amount + ' WAX'
        }
      }
    ]

    await dispatch('sendTransaction', actions)
  },

  async list(
    { state, rootState, dispatch },
    { asset_ids, listing_price, currentListing = null }
  ) {
    const actions = []
    if (currentListing)
      actions.push({
        account: 'atomicmarket',
        name: 'cancelsale',
        authorization: [rootState.user.authorization],
        data: { sale_id: currentListing }
      })
    actions.push({
      account: 'atomicmarket',
      name: 'announcesale',
      authorization: [rootState.user.authorization],
      data: {
        seller: rootState.user.name,
        asset_ids,
        listing_price,
        settlement_symbol: '8,WAX',
        maker_marketplace: ''
      }
    })
    actions.push({
      account: 'atomicassets',
      name: 'createoffer',
      authorization: [rootState.user.authorization],
      data: {
        sender: rootState.user.name,
        recipient: 'atomicmarket',
        sender_asset_ids: asset_ids,
        recipient_asset_ids: [],
        memo: 'sale'
      }
    })

    await dispatch('sendTransaction', actions)
  },

  async makeBid({ rootState, dispatch }, { waxAmount, auction_id }) {
    const actions = [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [rootState.user.authorization],

        data: {
          from: rootState.user.name,
          to: 'atomicmarket',
          quantity: waxAmount + ' WAX',
          memo: 'deposit'
        }
      },
      {
        account: 'atomicmarket',
        name: 'auctionbid',
        authorization: [rootState.user.authorization],
        data: {
          bidder: rootState.user.name,
          auction_id,
          bid: waxAmount + ' WAX',
          taker_marketplace: ''
        }
      }
    ]

    console.log('aaaaa', actions)

    await dispatch('sendTransaction', actions)
  },

  async sendTradeOffer(
    { rootState, dispatch },
    { recipient, sender_asset_ids, recipient_asset_ids, memo = '' }
  ) {
    const actions = [
      {
        account: 'atomicassets',
        name: 'createoffer',
        authorization: [rootState.user.authorization],
        data: {
          sender: rootState.user.name,
          recipient,
          sender_asset_ids,
          recipient_asset_ids,
          memo
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  async auction(
    { state, rootState, dispatch },
    { asset_ids, starting_bid, duration, currentListing }
  ) {
    const actions = [
      {
        account: 'atomicmarket',
        name: 'announceauct',
        authorization: [rootState.user.authorization],
        data: {
          seller: rootState.user.name,
          asset_ids,
          starting_bid,
          duration,
          maker_marketplace: ''
        }
      },
      {
        account: 'atomicassets',
        name: 'transfer',
        authorization: [rootState.user.authorization],
        data: {
          from: rootState.user.name,
          to: 'atomicmarket',
          asset_ids,
          memo: 'auction'
        }
      }
    ]

    await dispatch('sendTransaction', actions)
  },

  async claimGift(
    { rootState, dispatch },
    { link_id, claimer, claimer_signature }
  ) {
    const actions = [
      {
        account: 'atomictoolsx',
        name: 'claimlink',
        data: {
          link_id,
          claimer,
          claimer_signature
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  async sendBuyOffer(
    { state, rootState, dispatch },
    { buyOfferPrice, assetsIDs, memo, seller }
  ) {
    const actions = [
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: rootState.user.name,
            permission: 'owner'
          }
        ],
        data: {
          from: rootState.user.name,
          to: 'atomicmarket',
          quantity: buyOfferPrice,
          memo: 'deposit'
        }
      },
      {
        account: 'atomicmarket',
        name: 'createbuyo',
        authorization: [
          {
            actor: rootState.user.name,
            permission: 'owner'
          }
        ],
        data: {
          buyer: rootState.user.name,
          recipient: seller,
          price: buyOfferPrice,
          memo,
          maker_marketplace: '',
          asset_ids: assetsIDs
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  async buyAsset(
    { state, rootState, dispatch },
    { sale_id, asset_ids_to_assert, listing_price_to_assert }
  ) {
    const actions = [
      {
        account: 'atomicmarket',
        name: 'assertsale',
        authorization: [
          {
            actor: rootState.user.name,
            permission: 'owner'
          }
        ],
        data: {
          sale_id,
          asset_ids_to_assert,
          listing_price_to_assert,
          settlement_symbol_to_assert: '8,WAX'
        }
      },
      {
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
          {
            actor: rootState.user.name,
            permission: 'owner'
          }
        ],
        data: {
          from: rootState.user.name,
          to: 'atomicmarket',
          quantity: listing_price_to_assert,
          memo: 'deposit'
        }
      },
      {
        account: 'atomicmarket',
        name: 'purchasesale',
        authorization: [
          {
            actor: rootState.user.name,
            permission: 'owner'
          }
        ],
        data: {
          buyer: rootState.user.name,
          sale_id,
          intended_delphi_median: 0,
          taker_marketplace: ''
        }
      }
    ]
    await dispatch('sendTransaction', actions)
  },

  // TODO Relogin after check chain and relogin if possible
  async sendTransaction(
    { state, rootState, dispatch, getters, commit },
    actions
  ) {
    if (actions && actions[0].name != 'delegatebw' && state.lastWallet != 'wcw') {
      await dispatch('resources/showIfNeeded', undefined, { root: true })
    }

    commit(
      'loading/OPEN',
      { title: 'Connecting Wallet', text: 'Waiting transaction approval..' },
      { root: true }
    )

    try {
      const signedTx = await state.wallet.transact(
        { actions },
        { broadcast: false, expireSeconds: 360, blocksBehind: 3 }
      )

      // TODO Manage leap soon
      const packedTx = {
        signatures: signedTx.signatures,
        serializedTransaction: signedTx.resolved
          ? signedTx.resolved.serializedTransaction
          : signedTx.serializedTransaction
      }

      return await this.$rpc.send_transaction(packedTx)
    } catch (e) {
      throw e
    } finally {
      dispatch('update', {}, { root: true })
      commit('loading/CLOSE', {}, { root: true })
    }
  }
}

export const getters = {
  chainName(state, getters, rootState) {
    return rootState.network.name
  }
}
