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
    desc: 'EOS',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
      id: 'eos-eosio.token'
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
    hyperion: 'https://eos.eosusa.io',
    //hyperion: 'https://api.eossweden.org/',
    //hyperion: 'https://eos.hyperion.eosrio.io/v2/',
    //hyperion: 'https://mainnet.eosn.io/v2/', // ALERT It's GIVE BROKET HISTORY!!!
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://eos-api.alcor.exchange': 'Alcor - Finland',
      //'https://eos-api-1.alcor.exchange': 'Alcor - Finland',
      'https://eos.greymass.com': 'Greymass',
      //'https://mainnet.genereos.io': 'Generos',
      //'https://mainnet.eosamsterdam.net': 'EOS Amsterdam',
      //'https://api.eosn.io': 'EOS N',
      //'https://eos.dfuse.eosnation.io': 'Dfuse',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'avral.pro',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'avral.pro',
    },

    amm: {
      contract: 'swap.alcor',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    ibc: {
      name: 'eos',
      returnValueEnabled: true,
      proofSockets: ['wss://ibc-server.uxnetwork.io/eos', 'wss://eos.eosusa.io/ibc'],

      wrapLockContracts: {
        'ibc.prove': ['ibc.wl.ux', 'ibc.wl.tlos', 'ibc.wl.wax'],
        'ibc.alcor': ['w.ibc.alcor'],
        //'ibc.alcor': ['usdtlocktest'],
      },

      wrapTokenContracts: {
        'ibc.prove': ['ibc.wt.ux', 'ibc.wt.tlos', 'ibc.wt.wax'],
        'ibc.alcor': ['wombatbridge'],
      },
    },

    RECOMMENDED_MARKETS: [
      'SAND@sandiegocoin',
      'TCN@capitaltatch',
      'HASH@eoshashcoins',
      'JOKER@joker.eos',
    ],

    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: [
      'usdcoinchain',
      'effectaiswap',
      'tcapitalnote',
      'bosibc.io',
    ],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    USD_TOKEN: 'usdt-tethertether',

    popularTokens: [
      'eos-eosio.token',
      'usdt-tethertether',
      'wax-ibc.wt.wax',
      //'tlos-ibc.wt.tlos',
      //'utx-ibc.wt.ux',
      'pgl-prospectorsg',
      'wram-eosio.wram',
    ],

    GLOBAL_TOKENS: [
      'eos-eosio.token',
      'usdt-tethertether',
      'wram-eosio.wram',
      'pgl-prospectorsg',
      'wax-ibc.wt.wax',
      'chex-chexchexchex',
      'iq-everipediaiq',
      'box-token.defi',
      'efx-effecttokens',
      'wombat-wombatbridge',
      'mlnk-swap.pcash',
    ]
  },

  proton: {
    name: 'proton',
    desc: 'XPR',
    contract: 'alcor',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'XPR',
      precision: 4,
      id: 'xpr-eosio.token'
    },

    marketCreationFee: '1000.0000 XPR',
    feeAccount: 'avral',

    chainId: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',

    host: 'proton.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'https://explorer.xprnetwork.org',
    monitor_params: '',
    lightapi: 'https://proton.light-api.net',
    hyperion: 'https://proton.eu.eosamsterdam.net',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://proton-api.alcor.exchange': 'Alcor Proton node',
      'https://proton.eosusa.io': 'EOS USA',

      //'https://nodeproton.alcor.exchange': 'Alcor Proton node',
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

    amm: {
      contract: 'swap.alcor',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    RECOMMENDED_MARKETS: ['CIRCUS@pbcbank_xpr'],
    PINNED_MARKETS: [493],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: [
      'eosiotokens', 'albabank', 'bayramela', 'magaxpr', 'bartxpr', 'gokuxpr', 'btoken', 'hulkxpr', 'gretaxpr',
      'xprjesus', 'lgbtqxpr', 'pikachuxpr', 'wojakxpr', 'lgbtqxpr', 'softclarinet'
    ],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    USD_TOKEN: 'xusdc-xtokens',

    popularTokens: ['xpr-eosio.token', 'xusdt-xtokens', 'xusdc-xtokens', 'clan-clanx'],
    GLOBAL_TOKENS: [],
  },

  ux: {
    name: 'ux',
    desc: 'UX Network',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'UTX',
      precision: 4,
      id: 'utx-eosio.token'
    },

    marketCreationFee: '1000.0000 UTX',
    feeAccount: 'alcordexteam',

    chainId: '8fc6dce7942189f842170de953932b1f66693ad3788f766e777b6f9d22335c02',

    host: 'api.uxnetwork.io',
    port: 443,
    protocol: 'https',
    monitor: 'https://explorer.uxnetwork.io',
    monitor_params: '',
    lightapi: 'https://wax.light-api.net',
    hyperion: 'https://ux.eosusa.io',

    //hyperion: 'https://wax.pink.gg/',
    //hyperion: 'https://api.waxsweden.org',
    //backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://explorer.uxnetwork.io': 'UX Explorer',
    },

    otc: {
      // TODO
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa',
    },

    pools: {
      // TODO
      contract: 'alcorammswap',
      fee: 'aw.aq.waa',
    },

    amm: {
      contract: 'swap.alcor',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    ibc: {
      name: 'ux',
      returnValueEnabled: false,
      proofSockets: ['wss://ibc-server.uxnetwork.io/ux'],

      wrapLockContracts: {
        'ibc.prove': ['ibc.wl.eos', 'ibc.wl.tlos', 'ibc.wl.wax'],
      },

      wrapTokenContracts: {
        'ibc.prove': ['ibc.wt.wax', 'ibc.wt.tlos', 'ibc.wt.eos'],
      },
    },

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],

    SCAM_CONTRACTS: [],

    CEX_CONTRACTS: [],

    nftMarket: {
      // TODO
      contract: '',
    },

    USD_TOKEN: '',

    popularTokens: [],
    GLOBAL_TOKENS: [],
  },

  wax: {
    name: 'wax',
    desc: 'WAX',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8,
      id: 'wax-eosio.token'
    },

    //farmCreationFee: { amount: 5, token: 'usdt-usdt.alcor' },
    marketCreationFee: '500.00000000 WAX',
    feeAccount: 'fees.alcor',

    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',

    host: 'wax.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'http://wax.bloks.io',
    monitor_params: '',
    lightapi: 'https://wax.light-api.net',
    //hyperion: 'https://wax-history.eosdac.io',
    hyperion: 'https://wax.eu.eosamsterdam.net',

    //hyperion: 'https://wax.pink.gg/',
    //hyperion: 'https://api.waxsweden.org',
    //backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://wax-api2.alcor.exchange': 'Alcor API2',
      'https://wax-api.alcor.exchange': 'WAX Alcor - Finland',
      'https://wax.greymass.com': 'Greymass - Canada',
      'https://api-wax-mainnet.wecan.dev': 'WeCan',
      'https://wax.cryptolions.io': 'CryptoLions',
      'https://wax.eosdac.io': 'EosDac',
      'https://wax.eosusa.io': 'EosUSA',
      'https://wax.api.eosnation.io': 'EosNation',
      'https://hyperion6.sentnl.io': 'Sentnl',

      // 'https://wax.eu.eosamsterdam.net': 'EOSAmsterdam - Amsterdam',
      // 'https://wax.pink.gg': 'Pink GG - Germany',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'aw.aq.waa',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'aw.aq.waa',
    },

    amm: {
      //contract: 'ammcontract4'
      contract: process.env.WAX_SWAP_CONTRACT || 'swap.alcor',
      //creationFee: '150.00000000 WAX',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    ibc: {
      name: 'wax',
      returnValueEnabled: true,
      proofSockets: ['wss://ibc-server.uxnetwork.io/wax', 'wss://wax.eosusa.io/ibc'],

      wrapLockContracts: {
        'ibc.prove': ['ibc.wl.eos', 'ibc.wl.ux', 'ibc.wl.tlos'],
        'ibc.alcor': ['wombatbridge'],
      },

      wrapTokenContracts: {
        'ibc.prove': ['ibc.wt.ux', 'ibc.wt.tlos', 'ibc.wt.eos'],
        'ibc.alcor': ['usdt.alcor'],
        //'ibc.alcor': ['wrapusdttest'],
      },
    },

    RECOMMENDED_MARKETS: ['TLM@tlm-alien.worlds'],
    PINNED_MARKETS: [
      910, // other
      /* USDT put others after */ 763,
      185,
      843
    ],
    BANNER_MARKETS: [],

    SCAM_CONTRACTS: [
      'okbtothemoon',
      'huobideposit',
      'binancecleos',
      'kucoindoteos',
      'eosbndeposit',
      'usdcoinchain',
      'pornhubgames',
      'createtokens',
      'getweedtoken',
      'machine.army',
      'onfederation',
      'martaintoken',
      'martiantoken',
      'superruncoin',
      'bosibc.io',
      'junkoqwertyu',
      'orderofomnis',
      'bullwaxtoken'
      // 'bmpm.gm',
      // 'bobocoin.gm'
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

    USD_TOKEN: 'usdt-usdt.alcor',

    popularTokens: [
      'wax-eosio.token',
      'waxusdc-eth.token',
      //'usdt-usdt.alcor',
      //'eos-ibc.wt.eos',
      //'wombat-wombattokens',
      //'cred-musictoken',
      'wuf-wuffi',
      'tlm-alien.worlds',
    ],

    GLOBAL_TOKENS: [
      'usdt-usdt.alcor',
      'eos-ibc.wt.eos',
      'wax-eosio.token',
      'tlos-ibc.wt.tlos',
      'pgl-prospectorsg',
      'tlm-alien.worlds',
      'brwl-brawlertoken',
      'wombat-wombattokens',
      'martia-martia',
      'wuf-wuffi'
    ],
  },

  telos: {
    name: 'telos',
    desc: 'Telos',
    contract: 'eostokensdex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'TLOS',
      precision: 4,
      id: 'tlos-eosio.token'
    },

    marketCreationFee: '100.0000 TLOS',
    feeAccount: 'alcordexdivs',

    chainId: '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',

    host: 'telos.greymass.com',
    //host: 'mainnet.telos.net',
    port: 443,
    protocol: 'https',
    monitor: 'https://explorer.telos.net',
    monitor_params: '',
    lightapi: 'https://telos.light-api.net',
    //hyperion: 'https://hyperion.telosgermany.io/v2/',
    hyperion: 'https://telos.eosusa.io',
    backEnd: 'https://alcor.exchange/api/',

    client_nodes: {
      'https://telos-api.alcor.exchange': 'Alcor - Finland',
      'https://telos.greymass.com': 'Greymass - Canada',
      //'https://telos-api-1.alcor.exchange': 'Alcor - Finland',
    },

    otc: {
      contract: 'alcorotcswap',
      divs: 'alcordexdivs',
    },

    pools: {
      contract: 'alcorammswap',
      fee: 'alcordexdivs',
    },

    amm: {
      contract: 'swap.alcor',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    RECOMMENDED_MARKETS: ['KANDA@telokandaone', 'GUX@vapaeetokens'],

    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain', 'bosibc.io'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    ibc: {
      name: 'tlos',
      returnValueEnabled: true,
      proofSockets: ['wss://telos.eosusa.io/ibc', 'wss://ibc-server.uxnetwork.io/telos'],

      wrapLockContracts: {
        'ibc.prove': ['ibc.wl.ux', 'ibc.wl.eos'],
      },

      wrapTokenContracts: {
        'ibc.prove': ['ibc.wt.ux', 'ibc.wt.eos'],
      },
    },

    USD_TOKEN: 'xusdc-xtokens',

    popularTokens: [],
    GLOBAL_TOKENS: [],
  },

  ultra: {
    name: 'ultra',
    desc: 'Ultra',
    contract: 'book.alcor',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'UOS',
      precision: 8,
      id: 'uos-eosio.token'
    },

    marketCreationFee: '1.00000000 UOS',
    feeAccount: 'admin.alcor',

    chainId: 'a9c481dfbc7d9506dc7e87e9a137c931b0a9303f64fd7a1d08b8230133920097',

    host: 'api.mainnet.ultra.io',
    port: 443,
    protocol: 'https',
    monitor: 'https://explorer.mainnet.ultra.io',
    monitor_params: '',
    lightapi: 'https://mainnet.ultra.io',
    hyperion: 'https://ultra.eosusa.io',

    client_nodes: {
      'https://api.mainnet.ultra.io': 'Ultra.io',
    },

    otc: {
      contract: 'otc.alcor',
      divs: 'admin.alcor',
    },

    pools: {
      contract: 'swap.alcor',
      fee: 'admin.alcor',
    },

    amm: {
      contract: 'swap.alcor',
    },

    // staking: {
    //   contract: 'liquid.alcor',
    //   token: {
    //     contract: 'lsw.alcor',
    //     symbol: 'LSW',
    //     precision: 8,
    //     decimals: 8,
    //     id: 'lsw-lsw.alcor'
    //   }
    // },

    // ibc: {
    //   name: 'ux',
    //   returnValueEnabled: false,
    //   proofSockets: ['wss://ibc-server.uxnetwork.io/ux'],

    //   wrapLockContracts: {
    //     'ibc.prove': ['ibc.wl.eos', 'ibc.wl.tlos', 'ibc.wl.wax'],
    //   },

    //   wrapTokenContracts: {
    //     'ibc.prove': ['ibc.wt.wax', 'ibc.wt.tlos', 'ibc.wt.eos'],
    //   },
    // },

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],

    SCAM_CONTRACTS: [],

    CEX_CONTRACTS: [],

    nftMarket: {
      contract: '',
    },

    USD_TOKEN: '',

    popularTokens: [],
    GLOBAL_TOKENS: [],
  },

  waxtest: {
    name: 'waxtest',
    desc: 'Wax testnet',
    contract: 'alcordexswap',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'WAX',
      precision: 8,
      id: 'wax-eosio.token'
    },
    marketCreationFee: '3.00000000 WAX',
    feeAccount: '',

    chainId: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    host: 'waxtestnet.greymass.com',
    port: 443,
    protocol: 'https',
    monitor: 'https://wax-test.bloks.io',
    monitor_params: '',
    lightapi: 'https://testnet-lightapi.eosams.xeos.me',
    hyperion: 'https://jungle3.cryptolions.io',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: {
      'https://waxtestnet.greymass.com': 'Greymass - Canada',
    },

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1',
    },

    pools: {
      //contract: 'alcordexswap',
      //fee: 'evodextester',
    },

    amm: {
      contract: 'swap.alcor',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    popularTokens: [],
    GLOBAL_TOKENS: [],
  },

  jungle: {
    name: 'jungle',
    desc: 'Jungle testnet',
    contract: 'alcordexmain',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
      id: 'eos-eosio.token'
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
    hyperion: 'https://jungle3.cryptolions.io',
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

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'alcornftswap',
    },

    popularTokens: [],
    GLOBAL_TOKENS: [],
  },

  local: {
    name: 'local',
    desc: 'Local network',
    contract: 'dex',

    baseToken: {
      contract: 'eosio.token',
      symbol: 'EOS',
      precision: 4,
      id: 'eos-eosio.token'
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
    hyperion: 'https://api.eossweden.org',
    backEnd: 'http://localhost:8000/api/',

    client_nodes: {},

    otc: {
      contract: 'wwweosswapio',
      divs: 'eosswapdivs1',
    },

    pools: {
      contract: 'pools',
    },

    amm: {
      contract: 'ammcontract1',
    },

    staking: {
      contract: 'liquid.alcor',
      token: {
        contract: 'lsw.alcor',
        symbol: 'LSW',
        precision: 8,
        decimals: 8,
        id: 'lsw-lsw.alcor'
      }
    },

    RECOMMENDED_MARKETS: [],
    PINNED_MARKETS: [],
    BANNER_MARKETS: [],
    SCAM_CONTRACTS: ['usdcoinchain'],
    CEX_CONTRACTS: [],

    nftMarket: {
      contract: 'nft',
    },
  },

  popularTokens: [],
  GLOBAL_TOKENS: [],
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
  IBC_NETWORKS: [networks.eos, networks.telos, networks.ux, networks.wax],
  NFT_LIST_ITEM_PP: 8,

  networks,
}
