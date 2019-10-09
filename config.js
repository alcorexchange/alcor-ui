const PRICE_SCALE = 100000000

const networks = {
  local: {
    name: 'local',
    contract: 'eostokensdex',

    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
    host: 'http://localhost:8888',
    port: 8888,
    protocol: 'http',
    monitor: 'https://jungle.eosx.io',
    lightapi: 'https://lightapi.eosgeneva.io'
  },

  jungle: {
    name: 'jungle',
    contract: 'eostokensdex',

    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
    host: 'https://api.jungle.alohaeos.com',
    port: 443,
    protocol: 'https',
    monitor: 'https://jungle.eosx.io',
    lightapi: 'https://lightapi.eosgeneva.io'
  },

  eos: {
    name: 'eos',
    contract: 'eostokensdex',

    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',

    host: 'https://api.main.alohaeos.com:443',
    port: 443,
    protocol: 'https',
    monitor: 'https://eosx.io',
    lightapi: 'https://api.light.xeos.me'
  }
}

export default {
  APP_NAME: 'EOS Tokens',
  PRICE_SCALE,
  PRICE_DIGITS: PRICE_SCALE.toString().length - 1,

  ...networks[process.env.NETWORK] || networks.local
}
