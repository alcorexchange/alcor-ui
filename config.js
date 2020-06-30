const PRICE_SCALE = 100000000
const CONTRACT_ACTIONS = ['sellmatch', 'buymatch', 'cancelbuy', 'cancelsell', 'sellreceipt', 'buyreceipt']
const MARKET_STATS_CACHE_TIME = 60 * 30

const networks = {
  eos: {
    name: 'eos',
    desc: 'EOS mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4
    },

    marketCreationFee: '5.0000 EOS',
    feeAccount: 'avral.pro',

    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',

    //host: 'eosbp.atticlab.net',
    //host: 'eos.greymass.com',
    //host: 'eos.greymass.com',
    host: 'eos.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    hyperion: 'https://api.eossweden.org/v2/',
    //hyperion: 'https://eos.hyperion.eosrio.io/v2/',
    // ALERT It's TAKE BROKET HISTORY!!! hyperion: 'https://mainnet.eosn.io/v2/',
    backEnd: 'https://alcor.exchange/api/',

    otc: {
      contract: 'alcorotcswap',
      divs: 'avral.pro'
    },

    pools: {
      contract: 'evolutiondex',
      fee: 'wevotethefee'
    },

    withdraw: {
      'TLOSP@steemenginex': {
        desc: 'Telos peged token. You can buy it for EOS and withdraw to Telos 1:1',
        network: {
          name: 'Telos',
          symbol: 'TLOS'
        },
        withdrawMemo: 'TLOS {account}',
        gateway: 'steemenginex'
      },

      'BTCP@steemenginex': {
        desc: 'Bitcoin peged token. You can buy it for EOS and withdraw to Bitcoin address 1:1',
        network: {
          name: 'Bitcoin',
          symbol: 'BTC'
        },
        withdrawMemo: 'BTC {account}',
        gateway: 'steemenginex'
      },
    },

    RECOMMENDED_MARKETS: ['WAX@bosibc.io', 'SAND@sandiegocoin', 'TCN@tcapitalnote'],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'alcornftswap'
    },
  },

  wax: {
    name: 'wax',
    desc: 'WAX mainnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8
    },

    marketCreationFee: '1500.00000000 WAX',
    feeAccount: 'aw.aq.waa',

    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',

    host: 'wax.eu.eosamsterdam.net',
    port: 443,
    protocol: 'https',
    monitor: 'http://wax.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosamsterdam.net',
    hyperion: 'https://api.waxsweden.org/v2/',
    backEnd: 'https://alcor.exchange/api/',

    otc: {
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa',
    },

    pools: {
      contract: 'alcordexpool',
      fee: 'aw.aq.waa'
    },

    withdraw: {},

    RECOMMENDED_MARKETS: ['EOS@bosibc.io', 'GPKMEGA@packs.topps', 'GPKFIVE@packs.topps'],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'alcornftswap'
    }
  },

  telos: {
    name: 'telos',
    desc: 'Telos mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'TLOS',
      precision: 4
    },

    marketCreationFee: '100.0000 TLOS',
    feeAccount: 'alcordexdivs',

    chainId: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',

    host: 'api.telosgermany.io',
    //host: 'telos.caleos.io',
    port: 443,
    protocol: 'https',
    monitor: 'http://telos.bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    hyperion: 'https://hyperion.telosgermany.io/v2/',
    backEnd: 'https://alcor.exchange/api/',

    otc: {
      contract: 'alcorotcswap',
      divs: 'alcordexdivs'
    },

    pools: {
      contract: 'evolutiondex',
      fee: 'wevotethefee'
    },

    RECOMMENDED_MARKETS: ['EOS@bosibc.io', 'KANDA@telokandaone'],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'alcornftswap'
    },

    withdraw: {
      'EOSP@steemenginex': {
        desc: 'EOS peged token. You can buy it for TLOS and withdraw to EOS 1:1. Gateway fee will be 1%(Steem-engine)',
        withdrawMemo: 'TLOS {account}',
        gateway: 'steemenginex',
        network: {
          name: 'EOS Mainnet',
          symbol: 'EOS'
        }
      },

      'KANDA@telokandaone': {
        desc: 'KANDA peged token. You can buy it for TLOS and withdraw to Hive-Engine. Gateway fee will be 1%(Hive-engine)',
        withdrawMemo: 'KANDA {account}',
        gateway: 'telokandaone',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive'
        }
      }
    }
  },

  bos: {
    name: 'bos',
    desc: 'BOS mainnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'BOS',
      precision: 4
    },

    marketCreationFee: '500.0000 BOS',
    feeAccount: 'avral.pro',

    chainId: 'd5a3d18fbb3c084e3b1f3fa98c21014b5f3db536cc15d08f9f6479517c6a3d86',

    host: 'api.bossweden.org',
    port: 443,
    protocol: 'https',
    monitor: 'http://bos.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosamsterdam.net',
    hyperion: 'https://bos.eosn.io/v2/',
    backEnd: 'https://alcor.exchange/api/',

    otc: {
      contract: 'alcorotcswap',
      divs: 'avraldigital'
    },

    pools: {
      contract: 'lp'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: ['EOS@bosibc.io', 'WAX@bosibc.io', 'TLOS@bosibc.io', ''],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'nft'
    }
  },

  coffe: {
    name: 'coffe',
    desc: 'COFFE mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'CFF',
      precision: 4
    },
    marketCreationFee: '20.0000 CFF',
    feeAccount: 'avral.pro',

    chainId: '1ca925bc8fbc1cec262dedd10fd19d9357a1cc8de0bd92e5b61577740af9a3f2',

    host: 'coffe.io',
    port: 8888,
    protocol: 'https',
    monitor: 'http://local.bloks.io',
    monitor_params: 'nodeUrl=coffe.io:8888&coreSymbol=CFF&systemDomain=eosio&hyperionUrl=https://resurces.com:17555',
    lightapi: 'http://coffe.io:5001',
    hyperion: 'https://resurces.com:17555/v2/',
    backEnd: 'https://alcor.exchange/api/',

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'lp'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'nft'
    }
  },


  jungle: {
    name: 'jungle',
    desc: 'Jungle testnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4
    },
    marketCreationFee: '3.0000 EOS',
    feeAccount: 'avral.pro',

    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
    host: 'api.jungle3.alohaeos.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://jungle3.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'https://jungle3.cryptolions.io/v2/',
    backEnd: 'http://localhost:8000/api/',

    //chainId: 'e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473',
    //host: 'api.jungle.alohaeos.com',
    //port: 443,
    //protocol: 'https',
    //monitor: 'http://jungle.bloks.io',
    //monitor_params: '',
    //lightapi: 'https://lightapi.eosgeneva.io',
    //hyperion: 'https://api.jungle.hyperion.greeneosio.com/v2/',
    //backEnd: 'http://localhost:8000/api/',

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'evolutiondex',
      fee: 'evodextester'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'alcornftswap'
    }
  },

  local: {
    name: 'local',
    desc: 'Local network',
    contract: 'dex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4
    },
    marketCreationFee: '3.0000 EOS',
    feeAccount: 'avral.pro',

    chainId: 'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f',
    host: 'localhost',
    port: 8888,
    protocol: 'http',
    monitor: 'http://jungle.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'https://api.eossweden.org/v2/',
    backEnd: 'http://localhost:8000/api/',

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'lp'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],

    nftMarket: {
      contract: 'nft'
    }
  }
}

// TODO Check is all chains configs is the same structure

module.exports = {
  APP_NAME: 'Alcor Exchange',
  PRICE_SCALE,
  PRICE_DIGITS: PRICE_SCALE.toString().length - 1,
  CONTRACT_ACTIONS,
  MARKET_STATS_CACHE_TIME,

  networks
}
