import Vue from 'vue'
import moment from 'vue-moment'

import config from '~/config'

Vue.use(moment)

Vue.filter('monitorTx', function (tx) {
  return `${config.monitor}/transaction/${tx}?tab=traces&${config.monitor_params}`
})

Vue.filter('humanFloat', function(amount, PRICE_DIGITS = config.PRICE_DIGITS) {
  const price = (amount / config.PRICE_SCALE)

  return parseFloat(price.toFixed(PRICE_DIGITS))
    .toLocaleString('en', { minimumFractionDigits: Math.min(PRICE_DIGITS, 2), maximumFractionDigits: PRICE_DIGITS })
})

Vue.prototype.$tokenLogo = function(symbol, contract) {
  const network = this.$store.state.network.name

  try {
    return require(`@/assets/tokens/${network}/${symbol.toLowerCase()}_${contract}.png`)
  } catch {
    return `https://raw.githubusercontent.com/BlockABC/eos-tokens/master/tokens/${contract}/${symbol}.png`
  }
}
