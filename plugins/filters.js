import Vue from 'vue'
import moment from 'vue-moment'

import config from '~/config'

Vue.use(moment)

Vue.filter('monitorTx', function (tx) {
  return `${config.monitor}/transaction/${tx}?tab=traces&${config.monitor_params}`
})

Vue.filter('humanFloat', function(amount, PRICE_DIGITS = config.PRICE_DIGITS) {
  return (amount / config.PRICE_SCALE).toFixed(PRICE_DIGITS)
})

Vue.prototype.$tokenLogo = function(symbol, contract) {
  try {
    return require(`@/assets/tokens/${symbol.toLowerCase()}_${contract}.png`)
  } catch {
    return `https://raw.githubusercontent.com/BlockABC/eos-tokens/master/tokens/${contract}/${symbol}.png`
  }
}
