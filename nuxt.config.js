const config = require('./config')
const pkg = require('./package')

const isSPA = process.argv.includes('--spa')
const isDev = process.env.npm_lifecycle_event == 'dev' || process.argv.includes('--dev') || process.env.NODE_ENV !== 'production'

const desc = config.APP_NAME + ' is the Swiss knife for decentralized finance! Yield-based Liquidity Pools | Limit Trading | NFT Market and much more!'

module.exports = {
  telemetry: false,

  env: {
    isDev,
    isSPA,
    NETWORK: process.env.NETWORK,
    DISABLE_DB: process.env.DISABLE_DB
  },

  version: pkg.version,

  /*
  ** Headers of the page
  */
  head: {
    title: config.APP_NAME + ' | EOS Trustless DEX.',

    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: desc },
      { name: 'msapplication-TileColor', content: '#da532c' },

      { hid: 'og:image', name: 'og:image', content: '/android-chrome-512x512.png' }

      //{ name: 'theme-color', content: '#ffffff' }
      //{ name: 'viewport', content: 'user-scalable = yes' }
    ],

    link: [
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'mask-icon', color: '#5bbad5', href: '/safari-pinned-tab.svg' },
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: {
    color: '#007bff'
    //height: '2px'
  },

  /*
  ** Global CSS
  */
  css: [
    // TODO Оставить только грид и ребут
    'bootstrap/dist/css/bootstrap.min.css',

    'bootstrap/dist/css/bootstrap-grid.min.css',
    'bootstrap/dist/css/bootstrap-reboot.min.css',

    'bootstrap-utilities/bootstrap-utilities.css',

    //'element-ui/lib/theme-chalk/index.css',
    //'~/assets/theme/_variables.scss',
    //'~/assets/theme/index.css',
    '~/assets/main.scss'
  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    '@/plugins/element-ui',
    '@/plugins/mixins',
    '@/plugins/filters',
    '@/plugins/global',

    { ssr: false, src: '~/plugins/startapp.js' },
    { ssr: false, src: '~/plugins/localStorage.js' },
    { ssr: false, src: '~/plugins/vue-apexchart.js' },
  ],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    '@nuxtjs/axios',
    '@nuxtjs/sentry',
    //'vue-github-buttons/nuxt',
    'nuxt-imagemin',
    'vue-scrollto/nuxt',
    //'nuxt-purgecss' // FIXME Fails on docker pro
  ],

  axios: {
  },

  colorMode: {
    //preference: 'system', // default value of $colorMode.preference
    preference: 'dark', // default value of $colorMode.preference
    fallback: 'dark', // fallback value if not system preference found
    classPrefix: 'theme-',
    classSuffix: ''
  },

  //components: true,

  /*
  ** Sentry module configuration
  */
  sentry: {
    dsn: process.env.SENTRY_DSN || 'https://a0486e29af0f4630a29b820ee4226fa8@sentry.io/1792380',
    disabled: isDev
  },

  buildModules: [
    ['@nuxtjs/google-analytics', { id: 'UA-155720239-1' }],
    '@nuxtjs/color-mode',
    '@nuxtjs/device'
  ],

  /*
  ** Build configuration
  */
  build: {
    extend(config, ctx) {
      config.node = {
        fs: 'empty'
      }

      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }

      config.module.rules.push({
        test: /\.(ogg|mp3|wav|mpe?g)$/i,
        loader: 'file-loader',
        options: {
          esModule: false,
          name: '[path][name].[ext]'
        }
      })

      if (isSPA) {
        config.output.publicPath = './_nuxt/'
      }
    }
  },

  router: {
    mode: isSPA ? 'hash' : 'history',
    linkActiveClass: 'active'
  },

  cache: {
    useHostPrefix: true,
    pages: [
      /^\/nft-market/

      ///^\/pools\/.*/,

      ///^\/$/
    ],
    store: {
      type: 'memory',
      max: 100,
      ttl: 60
    }
  }
}
