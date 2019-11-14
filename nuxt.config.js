const config = require('./config').default
const pkg = require('./package')

const isSPA = process.argv.includes('--spa')
const isDev = process.env.npm_lifecycle_event == 'dev'


const desc = 'With ' + config.APP_NAME + ' you can trade any EOS.IO tokens for EOS system token, onchain, without the participation of third parties!'

module.exports = {
  env: {
    isDev,
    NETWORK: process.env.NETWORK
  },

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
      { name: 'theme-color', content: '#ffffff' }
      //{ name: 'viewport', content: 'user-scalable = yes' }
    ],

    // TODO Что хза хуйня
    link: [{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }]
    //link: [{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    //link: [{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    //link: [{ rel: 'manifest', href: '/site.webmanifest' }],
    //link: [{ rel: 'mask-icon', color: '#5bbad5', href: '/safari-pinned-tab.svg' }]

    // link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },

  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },

  /*
  ** Global CSS
  */
  css: [
    'element-ui/lib/theme-chalk/index.css',
    'bootstrap-utilities/bootstrap-utilities.css',
    'bootstrap/dist/css/bootstrap.min.css',
    '~/assets/main.css'

  ],

  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
  '@/plugins/element-ui',
  '@/plugins/mixins',
  '@/plugins/filters',

  {ssr: false, src: '~/plugins/startapp.js'}
],

  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://github.com/nuxt-community/axios-module#usage
    '@nuxtjs/axios',
    '@nuxtjs/sentry',
    'vue-github-buttons/nuxt'
  ],
  /*
  ** Axios module configuration
  */
  axios: {
    // See https://github.com/nuxt-community/axios-module#options
  },

  /*
  ** Sentry module configuration
  */
  sentry: {
    dsn: process.env.SENTRY_DSN || 'https://a0486e29af0f4630a29b820ee4226fa8@sentry.io/1792380',
    disabled: isDev
  },

  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }

      if (isSPA) {
        config.output.publicPath = './_nuxt/'
      }
    }
  },

  router: {
    mode: isSPA ? 'hash' : 'history',
    linkActiveClass: 'active'
  }
}
