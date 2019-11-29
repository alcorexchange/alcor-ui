const PRICE_SCALE = 100000000

const networks = {
  local: {
    name: 'local',
    contract: 'eostokensdex',

    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
    host: 'localhost',
    port: 8888,
    protocol: 'http',
    monitor: 'http://jungle.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'https://api.eossweden.org/v2/',
    backEnd: 'http://localhost:8000/api/'
  },

  jungle: {
    name: 'jungle',
    contract: 'eostokensdex',

    chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
    host: 'api.jungle.alohaeos.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://jungle.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'http://api.jungle.hyperion.greeneosio.com/v2/',
    backEnd: 'http://localhost:8000/api/'
  },

  eos: {
    name: 'eos',
    contract: 'eostokensdex',

    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',

    host: 'api.main.alohaeos.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    //hyperion: 'https://api.eossweden.org/v2/',
    hyperion: 'https://mainnet.eosn.io/v2/',
    backEnd: 'https://eostokens.io/api/'
  },

  coffe: {
    name: 'coffe',
    contract: 'eostokensdex',

    chainId: '1ca925bc8fbc1cec262dedd10fd19d9357a1cc8de0bd92e5b61577740af9a3f2',

    host: 'coffe.io',
    port: 8888,
    protocol: 'https',
    monitor: 'http://local.bloks.io',
    monitor_params: 'coreSymbol=CFF&systemDomain=eosio&hyperionUrl=https://resurces.com:17555',
    lightapi: 'https://api.light.xeos.me',
    hyperion: 'https://resurces.com:17555/v2/',
    backEnd: 'https://eostokens.io/api/'
  }
}

export default {
  APP_NAME: 'EOS Tokens',
  PRICE_SCALE,
  PRICE_DIGITS: PRICE_SCALE.toString().length - 1,

  networks
}
