import Vue from 'vue'

import config from '~/config'

Vue.filter('monitorAccount', function (account) {
  return `${config.monitor}/account/${account}`
})


Vue.filter('humanFloat', function(amount, PRICE_DIGITS=config.PRICE_DIGITS) {
    return (amount / config.PRICE_SCALE).toFixed(PRICE_DIGITS)
})


Vue.prototype.$tokenLogo = function(symbol, contract) {
  if (symbol == 'PIXEOS' && contract == 'pixeos1token')
    return 'https://pixeos.io/ico/apple-touch-icon-57-precomposed.png'
  if (symbol == 'TKT' && contract == 'eossanguotkt')
    return require('@/assets/tokens/tkt_eossanguotkt.png')

  return `https://raw.githubusercontent.com/BlockABC/eos-tokens/master/tokens/${contract}/${symbol}.png`
}
