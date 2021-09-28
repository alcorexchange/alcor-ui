import Vue from 'vue'
import moment from 'vue-moment'

import config from '~/config'

Vue.use(moment)

Vue.filter('monitorTx', function (tx) {
  return `${config.monitor}/transaction/${tx}?tab=traces&${config.monitor_params}`
})

Vue.filter('humanPrice', function(amount, PRICE_DIGITS = config.PRICE_DIGITS) {
  const price = (amount / config.PRICE_SCALE)

  return parseFloat(price.toFixed(PRICE_DIGITS))
    .toLocaleString('en', { minimumFractionDigits: Math.min(PRICE_DIGITS, 2), maximumFractionDigits: PRICE_DIGITS })
})

Vue.filter('humanFloat', function(amount, precision = 4, MAX_DIGITS, MIN_DIGITS = 2) {
  const amt = amount / 10 ** precision

  if (MAX_DIGITS !== undefined) {
    MAX_DIGITS = Math.min(MAX_DIGITS, precision)
  } else {
    MAX_DIGITS = precision
  }

  return parseFloat(amt.toFixed(precision))
    .toLocaleString('en', { minimumFractionDigits: Math.min(MIN_DIGITS, parseFloat(precision)), maximumFractionDigits: MAX_DIGITS })
})

Vue.filter('commaFloat', function(amount, MAX_DIGITS, MIN_DIGITS = 2) {
  let result = parseFloat(amount).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 4 })

  if (typeof amount === 'string' && amount.includes(' ')) {
    result += ' ' + amount.split(' ')[1]
  }

  return result
})

Vue.filter('systemToUSD', function(amount, MAX_DIGITS, MIN_DIGITS = 2) {
  let result = parseFloat(amount)
  result *= this.$store.state.wallet.systemPrice
  return result.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 5 })
})

Vue.prototype.$systemToUSD = function(amount, MAX_DIGITS = 2, MIN_DIGITS = 2) {
  let result = parseFloat(amount)
  result *= this.$store.state.wallet.systemPrice
  return result.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: parseFloat(MAX_DIGITS) })
}


Vue.prototype.$tokenBalance = function(symbol, contract, full = true) {
  const user = this.$store.state.user

  if (user && user.balances) {
    const balance = user.balances.filter(b => b.currency == symbol.toUpperCase() && b.contract == contract)[0]

    if (balance) {
      return full ? balance.amount : balance.amount
    }
  }

  return '0.0000'
}


Vue.prototype.$tokenLogo = function(symbol, contract) {
  const network = this.$store.state.network.name

  try {
    if (contract == 'bosibc.io') {
      return require(`@/assets/tokens/bosibc.io/${symbol.toLowerCase()}.png`)
    } else {
      return require(`@/assets/tokens/${network}/${symbol.toLowerCase()}_${contract}.png`)
    }
  } catch {
    const tokens = this.$store.state.tokens

    const token = tokens.filter(t => t.chain == network && t.account == contract && t.symbol == symbol)[0]

    if (token) {
      return token.logo
    }

    return `https://raw.githubusercontent.com/BlockABC/eos-tokens/master/tokens/${contract}/${symbol}.png`
  }
}
