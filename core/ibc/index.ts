class Chain {
  name: string
  account: string

  wallets = []

  login() {}
  logout() {}

  isLogined() {}

  send() {}
  claim() {}
}

class Token {
  chain: Chain
  symbol = null
  address = null
  amount = 0
}

class Bridge {
  token: Token
  amount: number

  stage = 0
  statuses: {code: number, message: string}[]

  source: Chain
  destination: Chain

  processing() {}

  constructor(source: Chain, destination: Chain, amount: number) {
    this.amount = amount

    this.source = source
    this.destination = destination
  }

  isValid() {
    if (!this.source || !this.destination) throw new Error('Chain not chosen')
    if (isNaN(this.amount)) throw new Error('Invalid amount')
  }
}

export function createBridge(from: Chain, to: Chain, token: Token) {

}
