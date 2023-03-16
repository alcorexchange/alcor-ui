import axios from 'axios'
//import { Network } from '../../global.d'

export async function updateSystemPrice(network: Network) {
  console.log({ network })
  const { data } = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: network.name,
        vs_currencies: 'usd',
      },
    }
  )

  console.log({ data })
  // commit('setSystemPrice', data[rootState.network.name].usd)
  // console.log(network)
}
