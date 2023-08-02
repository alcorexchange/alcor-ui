import createPersistedState from 'vuex-persistedstate'

export default ({ store }) => {
  createPersistedState({
    key: 'presist_v0.3.02',

    paths: [
      'chain.payForUser', 'chain.lastWallet',

      'swap.slippage', 'swap.tab',

      'market.showVolumeInUSD', 'market.markets_active_tab', 'market.markets_layout',
      'market.current_market_layout', 'market.header_settings', 'market.chart_orders_settings',
      'market.orderbook_settings',

      'settings.sideMaretsTab', 'settings.favMarkets', 'settings.twChart',
      'settings.hideOtherPairs', 'settings.timesAndSales', 'settings.rpc_nodes',
      'settings.markets_timesale_tab',

      'ibcBridge.step', 'ibcBridge.tx', 'ibcBridge.packedTx', 'ibcBridge.error', 'ibcBridge.result',
      'ibcBridge.sourceName', 'ibcBridge.destinationName', 'ibcBridge.proofs', 'ibcBridge.asset',

      'amm.swap.showChart', 'amm.maxHops'
    ]
  })(store)
}
