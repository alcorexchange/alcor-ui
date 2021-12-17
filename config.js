const PRICE_SCALE = 100000000
const CONTRACT_ACTIONS = ['sellmatch', 'buymatch', 'cancelbuy', 'cancelsell', 'sellreceipt', 'buyreceipt']
const MARKET_STATS_CACHE_TIME = 60 * 30

const networks = {
  eos: {
    name: 'eos',
    desc: 'EOS Mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4
    },

    marketCreationFee: '10.0000 EOS',
    feeAccount: 'avral.pro',

    chainId: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',

    //host: 'eosbp.atticlab.net',
    //host: 'eos.greymass.com',
    //host: 'mainnet.eosamsterdam.net',
    host: 'eos.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    hyperion: 'https://api.eossweden.org/',
    //hyperion: 'https://api.eossweden.org/',
    //hyperion: 'https://eos.hyperion.eosrio.io/v2/',
    //hyperion: 'https://mainnet.eosn.io/v2/', // ALERT It's GIVE BROKET HISTORY!!!
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: [
      'https://eos.greymass.com',
      'https://mainnet.genereos.io',
      'https://mainnet.eosamsterdam.net',
      'https://api.eosn.io',
      'https://eos.dfuse.eosnation.io'
    ],

    otc: {
      contract: 'alcorotcswap',
      divs: 'avral.pro'
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'avral.pro'
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
        desc: 'Bitcoin peged token. You can buy it for EOS and withdraw to Bitcoin address. 1% fee and 0.0001 BTCP Minimum requirement!',
        network: {
          name: 'Bitcoin',
          symbol: 'BTC'
        },
        withdrawMemo: 'BTC {account}',
        gateway: 'steemenginex'
      },

      'SAND@sandiegocoin': {
        desc: 'SAND peged token. You can buy it for EOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive'
        },
        withdrawMemo: 'SAND {account}',
        gateway: 'sandiegocoin'
      },

      'WEED@weedcashntwk': {
        desc: 'WEED peged token. You can buy it for EOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive'
        },
        withdrawMemo: 'WEED {account}',
        gateway: 'weedcashntwk'
      },

      'PBTC@btc.ptokens': {
        desc: 'Bitcoin peged token. You can buy it for EOS and withdraw to Bitcoin address 1:1',
        network: {
          name: 'Bitcoin',
          symbol: 'BTC'
        },
        withdrawMemo: '{account}',
        gateway: 'cross.chain'
      }

      //'PETH@eth.ptokens': {
      //  desc: 'Ethereum peged token. You can buy it for EOS and withdraw to Ethereum address 1:1',
      //  network: {
      //    name: 'Ethereum',
      //    symbol: 'ETH'
      //  },
      //  withdrawMemo: '{account}',
      //  gateway: 'cross.chain'
      //},
    },

    RECOMMENDED_MARKETS: ['WAX@bosibc.io', 'SAND@sandiegocoin', 'TCN@capitaltatch', 'HASH@eoshashcoins', 'JOKER@joker.eos'],
    SCAM_CONTRACTS: ['usdcoinchain', 'effectaiswap', 'tcapitalnote'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap'
    },

    USD_TOKEN: 'USDT@tethertether'
  },

  proton: {
    name: 'proton',
    desc: 'Proton Mainnet',
    contract: 'alcor',

    baseToken: {
      contract: 'xtokens',
      symbol: 'XUSDT',
      precision: 6
    },

    marketCreationFee: '1.000000 XUSDT',
    feeAccount: 'avral',

    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',

    host: 'proton.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://proton.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosamsterdam.net',
    hyperion: 'https://proton.eu.eosamsterdam.net',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: [
      'https://proton.greymass.com',
      'https://proton.pink.gg',
      'https://proton.eu.eosamsterdam.net',
      'http://api.protonnz.com',
      'http://api.proton.quantumblok.com',
      'http://proton.eoscafeblock.com',
      'http://proton.protonuk.io',
      'http://api.proton.eossweden.org',
      'http://proton.genereos.io',
      'http://api.eostribe.io'
    ],

    otc: {
      contract: 'alcorotc',
      divs: 'avral'
    },

    pools: {
      contract: 'alcordexpool',
      fee: 'aw.aq.waa'
    },

    withdraw: {},

    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: [],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap'
    },

    USD_TOKEN: 'XUSDC@xtokens'
  },

  wax: {
    name: 'wax',
    desc: 'WAX Mainnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8
    },

    marketCreationFee: '150.00000000 WAX',
    feeAccount: 'aw.aq.waa',

    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',

    host: 'wax.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://wax.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosamsterdam.net',
    hyperion: 'https://wax.eosrio.io',

    //hyperion: 'https://wax.pink.gg/',
    //hyperion: 'https://api.waxsweden.org',
    //backEnd: 'https://alcor.exchange/api/',

    client_nodes: [
      'https://waxnode01.alcor.exchange',
      'https://waxnode02.alcor.exchange',

      'https://wax.greymass.com',
      'https://wax.eu.eosamsterdam.net',
      'https://wax.eosn.io',
      'https://wax.pink.gg' // OK

      //'https://wax.cryptolions.io', CORS
      //'https://api.waxsweden.org', CORS
      // 'https://api.wax.liquidstudios.io', NOT WORKING
      // 'https://wax.eoseoul.io' CORS
      // 'https://wax.eosusa.news/' CORS
    ],

    otc: {
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa'
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'aw.aq.waa'
    },

    withdraw: {},

    RECOMMENDED_MARKETS: ['BABE@babe.hodl', 'BLUX@bluxbluxblux', 'PURPLE@purplepurple'],
    SCAM_CONTRACTS: ['usdcoinchain', 'pornhubgames', 'createtokens', 'getweedtoken', 'machine.army', 'onfederation'],
    CEX_CONTRACTS: ['huobiwaxdepo', 'waxonbinance', 'kcstothemoon', 'bithumbwaxr1'],

    nftMarket: {
      contract: 'alcornftswap'
    },

    USD_TOKEN: 'XUSDC@xtokens'
  },

  telos: {
    name: 'telos',
    desc: 'Telos Mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'TLOS',
      precision: 4
    },

    marketCreationFee: '100.0000 TLOS',
    feeAccount: 'alcordexdivs',

    chainId: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',

    host: 'telos.greymass.com',
    //host: 'mainnet.telos.net',
    port: 443,
    protocol: 'https',
    monitor: 'http://telos.bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    //hyperion: 'https://hyperion.telosgermany.io/v2/',
    hyperion: 'http://api.kainosbp.com',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: [
      'https://telos.greymass.com'
    ],

    otc: {
      contract: 'alcorotcswap',
      divs: 'alcordexdivs'
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'alcordexdivs'
    },

    RECOMMENDED_MARKETS: ['EOS@bosibc.io', 'KANDA@telokandaone', 'GUX@vapaeetokens'],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

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
      },

      'SAND@sandiegocoin': {
        desc: 'SAND peged token. You can buy it for TLOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive'
        },
        withdrawMemo: 'SAND {account}',
        gateway: 'sandiegocoin'
      }
    }
  },

  bos: {
    name: 'bos',
    desc: 'BOS Mainnet',
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
    hyperion: 'https://api.bossweden.org/',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: [],

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
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'nft'
    }
  },

  coffe: {
    name: 'coffe',
    desc: 'COFFE Mainnet',
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

    client_nodes: [],

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
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'nft'
    }
  },

  waxtest: {
    name: 'waxtest',
    desc: 'Wax testnet',
    contract: 'alcordexswap',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8
    },
    marketCreationFee: '3.00000000 WAX',
    feeAccount: '',

    chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    host: 'waxtestnet.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://jungle3.bloks.io',
    monitor_params: '',
    lightapi: 'https://api.light.xeos.me',
    hyperion: 'https://jungle3.cryptolions.io/',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: [],

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'alcordexswap',
      fee: 'evodextester'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap'
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
    feeAccount: 'evodextester',

    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
    host: 'jungle3.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://jungle3.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'https://jungle3.cryptolions.io/',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: [],

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'evodextester'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

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

    chainId: '8a34ec7df1b8cd06ff4a8abbaa7cc50300823350cadc59ab296cb00d104d2b8f',
    host: '127.0.0.1',
    port: 8888,
    protocol: 'http',
    monitor: 'http://jungle.bloks.io',
    monitor_params: '',
    lightapi: 'https://lightapi.eosgeneva.io',
    hyperion: 'https://api.eossweden.org/v2/',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: [],

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1'
    },

    pools: {
      contract: 'pools'
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

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
