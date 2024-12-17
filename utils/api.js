import axios from 'axios'

export async function loadAccountBalancesHyperion(account, endpoint, tokens = []) {
  console.log('loadAccountBalancesHyperion..', account, tokens)

  const { data } = await axios.get(`${endpoint}/v2/state/get_tokens`, {
    params: { account, limit: 10000 },
  })

  if (Array.isArray(data?.tokens) && data.tokens.length) {
    const tokenPrices = new Map(tokens.map((t) => [t.id, t.usd_price]))

    const balances = data.tokens
      .filter((b) => parseFloat(b.amount) > 0)
      .map((token) => {
        const id = `${token.symbol}-${token.contract}`.toLowerCase()
        const price = tokenPrices.get(id) || 0

        return {
          ...token,
          id,
          currency: token.symbol,
          decimals: token.precision,
          usd_value: parseFloat(token.amount) * price,
        }
      })

    return balances
  }

  return []
}
