const RESIZER_URL = 'https://resizer.alcor.exchange/'
const PUBLIC_RESIZER_URL = 'https://ipfs.io/'

const PRICE_SCALE = 100000000
const CONTRACT_ACTIONS = [
  'sellmatch',
  'buymatch',
  'cancelbuy',
  'cancelsell',
  'sellreceipt',
  'buyreceipt',
]
const MARKET_STATS_CACHE_TIME = 60 * 30

// TODO Check is all chains configs is the same structure
const networks = {
  eos: {
    name: 'eos',
    desc: 'EOS Mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
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
    lightapi: 'https://eos.light-api.net',
    hyperion: 'https://api.eossweden.org/',
    //hyperion: 'https://api.eossweden.org/',
    //hyperion: 'https://eos.hyperion.eosrio.io/v2/',
    //hyperion: 'https://mainnet.eosn.io/v2/', // ALERT It's GIVE BROKET HISTORY!!!
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://eos.greymass.com': 'Greymass',
      'https://mainnet.genereos.io': 'Generos',
      'https://mainnet.eosamsterdam.net': 'EOS Amsterdam',
      'https://api.eosn.io': 'EOS N',
      'https://eos.dfuse.eosnation.io': 'Dfuse',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'avral.pro',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'avral.pro',
    },

    withdraw: {
      // TODO Устарел формат, обновить
      'TLOSP@steemenginex': {
        desc: 'Telos peged token. You can buy it for EOS and withdraw to Telos 1:1',
        network: {
          name: 'Telos',
          symbol: 'TLOS',
        },
        withdrawMemo: 'TLOS {account}',
        gateway: 'steemenginex',
      },

      'BTCP@steemenginex': {
        desc: 'Bitcoin peged token. You can buy it for EOS and withdraw to Bitcoin address. 1% fee and 0.0001 BTCP Minimum requirement!',
        network: {
          name: 'Bitcoin',
          symbol: 'BTC',
        },
        withdrawMemo: 'BTC {account}',
        gateway: 'steemenginex',
      },

      'SAND@sandiegocoin': {
        desc: 'SAND peged token. You can buy it for EOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive',
        },
        withdrawMemo: 'SAND {account}',
        gateway: 'sandiegocoin',
      },

      'WEED@weedcashntwk': {
        desc: 'WEED peged token. You can buy it for EOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive',
        },
        withdrawMemo: 'WEED {account}',
        gateway: 'weedcashntwk',
      },

      'PBTC@btc.ptokens': {
        desc: 'Bitcoin peged token. You can buy it for EOS and withdraw to Bitcoin address 1:1',
        network: {
          name: 'Bitcoin',
          symbol: 'BTC',
        },
        withdrawMemo: '{account}',
        gateway: 'cross.chain',
      },

      'TLOS@ibc.wt.tlos': {
        desc: 'Telos wrapped token. You can trade it and transfer between chains with no fee',
        network: {
          name: 'Telos',
          symbol: 'TLOS'
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

    RECOMMENDED_MARKETS: [
      'WAX@bosibc.io',
      'SAND@sandiegocoin',
      'TCN@capitaltatch',
      'HASH@eoshashcoins',
      'JOKER@joker.eos'
    ],

    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain', 'effectaiswap', 'tcapitalnote'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap'
    },

    USD_TOKEN: 'USDT@tethertether',
  },

  proton: {
    name: 'proton',
    desc: 'Proton Mainnet',
    contract: 'alcor',

    baseToken: {
      contract: 'xtokens',
      symbol: 'XUSDT',
      precision: 6,
    },

    marketCreationFee: '1.000000 XUSDT',
    feeAccount: 'avral',

    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',

    host: 'proton.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://proton.bloks.io',
    monitor_params: '',
    lightapi: 'https://proton.light-api.net',
    hyperion: 'https://proton.eu.eosamsterdam.net',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://nodeproton.alcor.exchange': 'Alcor Proton node',
      'https://proton.greymass.com': 'Greymass',
      'https://proton.pink.gg': 'Pink GG',
      'https://proton.eu.eosamsterdam.net': 'EOS Amsterdam',
      'https://api.protonnz.com': 'Protonnz',
      'https://proton.eoscafeblock.com': 'EOS Cafe',
      'https://proton.protonuk.io': 'Protonuk',
      'https://api.proton.eossweden.org': 'EOS Sweden',
      'https://proton.genereos.io': 'Generos',
      'https://api.eostribe.io': 'EOS Tribe',
    },

    otc: {
      contract: 'alcorotc',
      divs: 'avral',
    },

    pools: {
      contract: null,
      fee: 'aw.aq.waa',
    },

    withdraw: {},

    RECOMMENDED_MARKETS: ['PIXEL@thomashp'],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: [],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    USD_TOKEN: 'XUSDC@xtokens',
  },

  uxnetwork: {
    name: 'uxnetwork',
    desc: 'UX Network',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'UTX',
      precision: 4
    },

    marketCreationFee: '1000.0000 UTX',
    feeAccount: 'alcordexteam',

    chainId: '8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02',

    host: 'explorer.uxnetwork.io',
    port: 443,
    protocol: 'https',
    monitor: 'https://explorer.uxnetwork.io',
    monitor_params: '',
    lightapi: 'https://wax.light-api.net',
    hyperion: 'https://wax.eosrio.io',

    //hyperion: 'https://wax.pink.gg/',
    //hyperion: 'https://api.waxsweden.org',
    //backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://explorer.uxnetwork.io': 'UX Explorer'
    },

    otc: {
      // TODO
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa'
    },

    pools: {
      // TODO
      contract: 'alcorammswap',
      fee: 'aw.aq.waa'
    },

    withdraw: {},

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],

    SCAM_CONTRACTS: [],

    CEX_CONTRACTS: [],

    nftMarket: {
      // TODO
      contract: ''
    },

    USD_TOKEN: ''
  },

  wax: {
    name: 'wax',
    desc: 'WAX Mainnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8,
    },

    marketCreationFee: '1000.00000000 WAX',
    feeAccount: 'aw.aq.waa',

    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',

    host: 'wax.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://wax.bloks.io',
    monitor_params: '',
    lightapi: 'https://wax.light-api.net',
    hyperion: 'https://wax.eosrio.io',

    //hyperion: 'https://wax.pink.gg/',
    //hyperion: 'https://api.waxsweden.org',
    //backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      //'https://waxnode01.alcor.exchange': 'WAX Alcor - Finland',
      'https://waxnode02.alcor.exchange': 'WAX Alcor - Germany',

      'https://wax.greymass.com': 'Greymass - Canada',
      'https://wax.eu.eosamsterdam.net': 'EOSAmsterdam - Amsterdam',
      'https://wax.eosn.io': 'EOS Nation - Canada',
      'https://wax.pink.gg': 'Pink GG - Germany',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'aw.aq.waa',
    },

    withdraw: {},

    RECOMMENDED_MARKETS: ['TLM@tlm-alien.worlds'],
    PINNED_MARKETS: [156],
    BANNER_MARKETS: [156],

    SCAM_CONTRACTS: [
      'usdcoinchain',
      'pornhubgames',
      'createtokens',
      'getweedtoken',
      'machine.army',
      'onfederation',
      'martaintoken',
      'martiantoken',
      'superruncoin'
    ],

    CEX_CONTRACTS: [
      'huobiwaxdepo',
      'waxonbinance',
      'kcstothemoon',
      'bithumbwaxr1',
    ],

    nftMarket: {
      contract: 'alcornftswap',
    },

    USD_TOKEN: 'WAXUSDT@eth.token',
  },

  telos: {
    name: 'telos',
    desc: 'Telos Mainnet',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'TLOS',
      precision: 4,
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
    lightapi: 'https://telos.light-api.net',
    //hyperion: 'https://hyperion.telosgermany.io/v2/',
    hyperion: 'http://api.kainosbp.com',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://telos.greymass.com': 'Greymass - Canada',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'alcordexdivs',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'alcordexdivs',
    },

    RECOMMENDED_MARKETS: [
      'EOS@bosibc.io',
      'KANDA@telokandaone',
      'GUX@vapaeetokens',
    ],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    withdraw: {
      'EOSP@steemenginex': {
        desc: 'EOS peged token. You can buy it for TLOS and withdraw to EOS 1:1. Gateway fee will be 1%(Steem-engine)',
        withdrawMemo: 'TLOS {account}',
        gateway: 'steemenginex',
        network: {
          name: 'EOS Mainnet',
          symbol: 'EOS',
        },
      },

      'KANDA@telokandaone': {
        desc: 'KANDA peged token. You can buy it for TLOS and withdraw to Hive-Engine. Gateway fee will be 1%(Hive-engine)',
        withdrawMemo: 'KANDA {account}',
        gateway: 'telokandaone',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive',
        },
      },

      'SAND@sandiegocoin': {
        desc: 'SAND peged token. You can buy it for TLOS and withdraw to Hive-Engine address 1:1',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive',
        },
        withdrawMemo: 'SAND {account}',
        gateway: 'sandiegocoin',
      },

      'EOS@ibc.wt.eos': {
        desc: 'EOS wrapped token. You can buy it for TLOS and transfer between chains with no fee',
        network: {
          name: 'Hive-Engine',
          symbol: 'Hive',
        },
        withdrawMemo: 'SAND {account}',
        gateway: 'sandiegocoin'
      }
    },

    USD_TOKEN: 'XUSDC@xtokens',
  },

  waxtest: {
    name: 'waxtest',
    desc: 'Wax testnet',
    contract: 'alcordexswap',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8,
    },
    marketCreationFee: '3.00000000 WAX',
    feeAccount: '',

    chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    host: 'waxtestnet.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'https://wax-test.bloks.io/',
    monitor_params: '',
    lightapi: 'ttps://testnet-lightapi.eosams.xeos.me',
    hyperion: 'https://jungle3.cryptolions.io/',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: {},

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1',
    },

    pools: {
      contract: 'alcordexswap',
      fee: 'evodextester',
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },
  },

  jungle: {
    name: 'jungle',
    desc: 'Jungle testnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
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

    client_nodes: {},

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'evodextester',
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },
  },

  local: {
    name: 'local',
    desc: 'Local network',
    contract: 'dex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
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

    client_nodes: {},

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1',
    },

    pools: {
      contract: 'pools',
    },

    withdraw: {},
    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'nft',
    },
  },
}

// Default markes layouts
const TRADE_LAYOUTS = {
  classic: [
    {
      x: 0,
      y: 43,
      w: 28,
      h: 4,
      i: 'favorites-top-line',
      status: false,
      mw: 10,
      mh: 1,
      moved: false,
    },
    {
      x: 11,
      y: 0,
      w: 28,
      h: 43,
      i: 'chart',
      status: true,
      mw: 9,
      mh: 5,
      moved: false,
    },
    {
      x: 0,
      y: 0,
      w: 11,
      h: 43,
      i: 'order-depth',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 39,
      y: 0,
      w: 11,
      h: 43,
      i: 'time-sale',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 0,
      y: 43,
      w: 28,
      h: 21,
      i: 'open-order',
      status: true,
      mw: 10,
      mh: 4,
      moved: false,
    },
    {
      x: 28,
      y: 43,
      w: 22,
      h: 21,
      i: 'limit-market',
      status: true,
      mw: 6,
      mh: 7,
      moved: false,
    },
  ],

  classic_small: [
    {
      x: 0,
      y: 0,
      w: 14,
      h: 4,
      i: 'favorites-top-line',
      status: false,
      mw: 10,
      mh: 1,
      moved: false,
    },
    {
      x: 11,
      y: 0,
      w: 27,
      h: 45,
      i: 'chart',
      status: true,
      mw: 9,
      mh: 5,
      moved: false,
    },
    {
      x: 0,
      y: 0,
      w: 11,
      h: 45,
      i: 'order-depth',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 38,
      y: 0,
      w: 12,
      h: 45,
      i: 'time-sale',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 0,
      y: 45,
      w: 28,
      h: 23,
      i: 'open-order',
      status: true,
      mw: 10,
      mh: 4,
      moved: false,
    },
    {
      x: 28,
      y: 45,
      w: 22,
      h: 23,
      i: 'limit-market',
      status: true,
      mw: 6,
      mh: 7,
      moved: false,
    },
  ],

  advanced: [
    {
      x: 0,
      y: 0,
      w: 30,
      h: 4,
      i: 'favorites-top-line',
      status: true,
      mw: 10,
      mh: 1,
      moved: false,
    },
    {
      x: 0,
      y: 4,
      w: 30,
      h: 39,
      i: 'chart',
      status: true,
      mw: 9,
      mh: 5,
      moved: false,
    },
    {
      x: 30,
      y: 0,
      w: 10,
      h: 43,
      i: 'order-depth',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 40,
      y: 0,
      w: 10,
      h: 43,
      i: 'time-sale',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 0,
      y: 43,
      w: 28,
      h: 21,
      i: 'open-order',
      status: true,
      mw: 10,
      mh: 4,
      moved: false,
    },
    {
      x: 28,
      y: 43,
      w: 22,
      h: 21,
      i: 'limit-market',
      status: true,
      mw: 6,
      mh: 7,
      moved: false,
    },
  ],

  full: [
    {
      x: 0,
      y: 0,
      w: 28,
      h: 4,
      i: 'favorites-top-line',
      status: true,
      mw: 10,
      mh: 1,
      moved: false,
    },
    {
      x: 0,
      y: 4,
      w: 28,
      h: 39,
      i: 'chart',
      status: true,
      mw: 9,
      mh: 5,
      moved: false,
    },
    {
      x: 28,
      y: 0,
      w: 11,
      h: 43,
      i: 'order-depth',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 39,
      y: 0,
      w: 11,
      h: 43,
      i: 'time-sale',
      status: true,
      mw: 5,
      mh: 4,
      moved: false,
    },
    {
      x: 0,
      y: 43,
      w: 28,
      h: 21,
      i: 'open-order',
      status: true,
      mw: 10,
      mh: 4,
      moved: false,
    },
    {
      x: 28,
      y: 43,
      w: 22,
      h: 21,
      i: 'limit-market',
      status: true,
      mw: 6,
      mh: 7,
      moved: false,
    },
  ],
}

module.exports = {
  APP_NAME: 'Alcor Exchange',
  RESIZER_URL,
  PUBLIC_RESIZER_URL,
  PRICE_SCALE,
  PRICE_DIGITS: PRICE_SCALE.toString().length - 1,
  CONTRACT_ACTIONS,
  MARKET_STATS_CACHE_TIME,
  TRADE_LAYOUTS,

  networks
}
