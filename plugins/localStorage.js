import createPersistedState from 'vuex-persistedstate'

export default ({ store }) => {
  createPersistedState({
    key: 'presist_v0.2',
    paths: [
      'chain.payForUser', 'swap.slippage', 'swap.tab', 'chain.lastWallet',
      'market.showVolumeInUSD', 'market.markets_active_tab',
      'settings.sideMaretsTab', 'settings.favMarkets', 'settings.twChart'
    ]
  })(store)
}
