import web3Utils from 'web3-utils'

// TODO Withdraw module
export class PEG {
  network = ''
  store = null

  fee = 0
  min = 0.0001

  contract = ''
  symbol = ''
  precision = ''

  desc = ''

  constructor(store) {
    this.store = store
  }

  withdraw(address) {
    throw new Error('Withdraw is not implemented')
  }

  validate() {
    throw new Error('Validate is not implemented')
  }
}

class WAXUSDT extends PEG {
  fee = 0.01 // Percents

  min = 0.005

  network = 'Ethereum Mainnet'

  contract = 'eth.token'
  symbol = 'WAXUSDT'
  precision = 6

  desc = '1:1 USDT(on Ethereum) backed Token on WAX mainnet.'

  isEthAddress(address) {
    return true
  }

  format(amount) {
    return parseFloat(amount).toFixed(this.precision) + ' ' + this.symbol
  }

  getFee(amount) {
    return amount * this.fee
  }

  isValid(address) {
    if (!web3Utils.isAddress(address)) {
      throw new Error('This is not ETH address')
    }

    return Promise.resolve()
  }

  withdraw(amount, address) {
    console.log(amount, address)
    const fee = this.getFee(amount)
    const quantity = this.format(amount - fee)

    const actions = [{
      account: 'eth.token',
      name: 'withdraw',
      authorization: [this.store.state.user.authorization],
      data: {
        from: this.store.state.user.name,
        to_eth_address: address,
        quantity,
        max_fee: this.format(fee)
      }
    }]

    return this.store.dispatch('chain/sendTransaction', actions)
  }
}

const wax = {
  'WAXUSDT@eth.token': WAXUSDT
}

export default {
  wax
}
