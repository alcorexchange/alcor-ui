<template lang="pug">
.embed
  nuxt

  footer
    .row
      .col.d-flex
        span.ml-auto Created by
          b
            a(href="https://avral.pro" target="_blank")  #Avral
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters } from 'vuex'
import axios from 'axios'

import config from '~/config'

export default {
  data() {
    return {
      netError: false,
      lastCommit: {},

      networks: [],
      current_chain: '',

      app_name: config.APP_NAME,

      activeLink: null
    }
  },

  computed: {
    ...mapGetters(['user']),

    payForUser: {
      get () {
        return this.$store.state.chain.payForUser
      },

      set (value) {
        this.$store.commit('chain/setPayForUser', value)
      }
    }

    //...mapState({
    //  current_chain: state => state.network.name
    //})

  },

  watch: {
    $route (to, from) {
      this.activeLink = to.path
    }
  },

  mounted() {
    this.activeLink = this.$route.path
    this.$store.dispatch('checkIsMobile')
    this.getVersion()
  },

  async created() {
    this.networks = Object.values(config.networks)
    this.current_chain = this.$store.state.network.name

    try {
      await this.$store.getters['api/rpc'].get_info()
    } catch (e) {
      this.netError = true
      console.log('Net error', e)
    }
  },

  methods: {
    async logout() {
      await this.$store.dispatch('chain/logout')
    },

    changeChain(v) {
      // TODO Move to config: APP_DOMAIN
      if (this.current_chain == 'eos') {
        window.location = `https://alcor.exchange`
        return
      }
      window.location = `https://${this.current_chain}.alcor.exchange`
    },

    async login() {
      if (this.$store.state.chain.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for wallet'
        })

        try {
          await this.$store.dispatch('chain/login')
        } catch (e) {
          captureException(e)
          this.$notify({ title: 'Scatter login error', message: e.message, type: 'error' })
        } finally {
          loading.close()
        }
      } else {
        this.$notify({ title: 'Scatter not found', message: 'Pleace install or unlock Scatter', type: 'info' })
      }
    },

    async scatterConnect() {
      try {
        await this.$store.dispatch('chain/scatterConnect')

        if (this.$store.state.chain.scatterConnected)
          this.$notify({ title: 'Scatter', message: 'Scatter connected', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'Scatter error', message: e.message, type: 'error' })
      }
    },

    async getVersion() {
      this.lastCommit = (await axios.get('https://api.github.com/repos/avral/eostokens-ui/commits/master')).data
    }
  }
}
</script>

<style scoped>
.logo {
  height: 2.5em;
}

.chain-select {
  width: 90px;
}

.scatter-button {
  position: absolute;
  right: 0;
  z-index: 999;
}

.logo-text {
  font-size: 3em;
  font-family: sans-serif;
  font-weight: 100;
}

.el-menu-item:first-child {
  padding-left: 0px;
}

.el-menu-item:last-child {
  padding-right: 0px;
}

h1.lead {
  font-size: 1.2rem;
}

footer {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    padding-right: 5px;
}

@media only screen and (max-width: 600px) {
  .logo {
    height: 20px;
  }
}

.market-row {
  display: flex;
  align-items: center;

  padding: 7px 10px;
  border-top: outset;
  border-width: thin;
}

@media only screen and (max-width: 600px) {
  .el-dialog, .el-message-box, .el-notification {
    width: 95%;
  }
}
</style>
