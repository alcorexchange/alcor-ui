import createPersistedState from 'vuex-persistedstate'

export default ({ store }) => {
  createPersistedState({
    key: 'presist_v0.3',
    paths: [
      'chain.payForUser', 'swap.slippage', 'swap.tab', 'chain.lastWallet',
      'market.showVolumeInUSD', 'market.markets_active_tab', 'market.markets_layout',
      'settings.sideMaretsTab', 'settings.favMarkets', 'settings.twChart',
      'settings.hideOtherPairs'
    ]
  })(store)
}
