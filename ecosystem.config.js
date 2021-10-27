require('dotenv').config()

module.exports = {
  apps: [
    {
      name: 'Alcor-nuxt-ui',
      //exec_mode: 'cluster',
      //instances: 'max',
      //instances: 2,
      script: './node_modules/nuxt/bin/nuxt.js',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        NUXT_PORT: 7000,
        NUXT_HOST: '0.0.0.0'
      }
    },
    {
      name: 'Alcor-api-server',
      script: './server/index.js',
      node_args: '--nouse-idle-notification --expose-gc --max-old-space-size=8192 -r esm',
      env: {
        NODE_ENV: 'production',
        DISABLE_UI: true,
        NUXT_PORT: 7001
      }
    },
    {
      name: 'Alcor-ws-server',
      script: './server/socketService/index.js',
      node_args: '--nouse-idle-notification --expose-gc --max-old-space-size=8192 -r esm',
      env: {
        NODE_ENV: 'production',
        DISABLE_UI: true,
        PORT: 7012
      }
    },
    {
      name: 'Alcor-updater',
      script: './server/updater.js',
      node_args: '-r esm',
      env: {

      }
    }
  ]
}
