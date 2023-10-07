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

Vue.filter('commaFloat', function(num, precision = 4) {
  const pow = Math.pow(10, precision)

  let sym = ''

  if (typeof num === 'string' && num.includes(' ')) {
    sym = ' ' + num.split(' ')[1]
    num = num.split(' ')[0]
  }

  const rounded = Math.ceil(parseFloat(num) * pow) / pow
  const fixed = rounded.toFixed(precision)

  const [int, dec] = fixed.split('.')
  return int.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + (dec ? '.' + dec : '') + sym
})

Vue.filter('systemToUSD', function(amount, MAX_DIGITS, MIN_DIGITS = 2) {
  let result = parseFloat(amount)
  result *= this.$store.state.wallet.systemPrice
  return result.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 5 })
})

Vue.prototype.$tokenToUSD = function(amount, symbol, contract) {
  const parsed = parseFloat(amount)
  amount = (!amount || isNaN(parsed)) ? 0 : parsed
  const id = symbol.toLowerCase() + '-' + contract

  const price = this.$store.state.tokens.find(t => t.id == id)
  return (parseFloat(amount) * (price ? price.usd_price : 0)).toLocaleString('en', { maximumFractionDigits: 2 })
}

Vue.prototype.$systemToUSD = function(amount, MAX_DIGITS = 2, MIN_DIGITS = 2, usdt = false) {
  let result = parseFloat(amount)

  if (usdt) {
    return result.toLocaleString('en', { minimumFractionDigits: MIN_DIGITS, maximumFractionDigits: parseFloat(MAX_DIGITS) })
  }

  if (this.$store.state.wallet.systemPrice) {
    result *= this.$store.state.wallet.systemPrice
  } else {
    result = 0
  }
  //result *= this.$store.state.wallet.systemPrice
  return result.toLocaleString('en', { minimumFractionDigits: MIN_DIGITS, maximumFractionDigits: parseFloat(MAX_DIGITS) })
}

Vue.prototype.$tokenBalance = function(symbol, contract, full = true) {
  const user = this.$store.state.user

  if (user && user.balances) {
    const balance = user.balances.filter(b => b.currency == symbol.toUpperCase() && b.contract == contract)[0]

    if (balance) {
      return full ? balance.amount : balance.amount
    }
  }

  return full ? '0.0000 ' + symbol : '0.0000'
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
    const tokens = this.$store.state.eosAirdropTokens

    const token = tokens.find(t => t.chain == network && t.account == contract && t.symbol == symbol)

    if (token) {
      return token.logo
    } else {
      return null
    }
  }
}

Vue.prototype.$percentColor = function(percent, zeroColor = 'var(--text-default)') {
  percent = parseFloat(percent).toFixed(2)
  percent = parseFloat(percent)

  if (isNaN(percent)) return zeroColor
  if (percent > 0) return `var(--main-green)`
  if (percent < 0) return `var(--main-red)`
  return zeroColor
}
