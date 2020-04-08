<template lang="pug">
.container.mb-5.mt-1
  .row.mb-2
    .col
      el-menu.el-menu-demo(router, :default-active="activeLink", mode='horizontal')
        el-menu-item(index="/")
          img(src="~/assets/logos/alcor_logo.svg").logo

        el-menu-item(index="/markets") Markets

        el-menu-item(index="/about") About

        li.el-menu-item
          img(:src="require('~/assets/icons/' + current_chain + '.png')" height=25).mr-1

          el-select(v-model='current_chain', placeholder='Select', size="small" @change="changeChain").chain-select
            el-option(v-for='network in networks', :key='network.name', :value='network.name')
              img(:src="require('~/assets/icons/' + network.name + '.png')" height=25)
              span.ml-2 {{ network.desc }}

        li.el-menu-item
          el-tooltip(content="Join us on Telegram!" placement="top" effect="light").mr-2
            a(href="https://t.me/alcorexchange" target="_blank")
              img(src="/telegram.png" height="40")

        li.el-menu-item.scatter-button
          span(v-if="user")
            a(:href="monitorAccount(user.name)" target="_blank").mr-3 {{ $store.state.user.name }}
            el-button(v-if="user" size="small" type="info" plain @click="logout") logout

          el-button(@click="login" type="primary" size="small" v-else) Sign In via Scatter

      //el-tooltip(content="OTC Trustless swaps" placement="top" effect="light").ml-2
        a(href="https://swap.eostokens.io" target="_blank")
          img(src="~/assets/logos/tokenswap.svg" height="50").ml-2

  //.row
    .col-lg-9.col-md-12
      h1.align-self-center.lead.mt-3
        span No commissions
        a(:href="monitorAccount('eostokensdex')" target="_blank").text-primary.strong  FULLY-ONCHAIN

        span  exchange.
        br
        span  Create markets in one click, list your dapp token for one click, trade whatever you want.

    .col-lg-3.d-flex
      .align-items-center.mt-3.ml-lg-auto
        span(v-if="user")
          a(:href="monitorAccount(user.name)" target="_blank").mr-3 {{ $store.state.user.name }}
          el-button(v-if="user" size="small" type="info" plain @click="logout") logout

        el-button(@click="login" type="primary" size="medium" v-else) Sign In via Scatter
        // TODO Кнопка с тестком как ссылка на профиль

  nuxt

  .row.mt-3
    .col.text-mutted
      small
        span.text-muted App version:
          a(href="https://github.com/avral/alcor-ui" target="_blank").text-secondary
            span(v-if="lastCommit.commit")  {{ lastCommit.commit.message }}

  footer
    .row
      .col.d-flex
        span.ml-auto Created by
          b
            a(href="https://avral.pro" target="_blank")  #Avral
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'
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
    console.log(this.activeLink)
  },

  async created() {
    this.networks = Object.values(config.networks)
    this.current_chain = this.$store.state.network.name
    this.getVersion()

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

    changeChain() {
      // TODO Move to config: APP_DOMAIN
      if (this.current_chain == 'eos') {
        window.location = `https://alcor.exchange`
      }
      window.location = `https://${this.current_chain}.alcor.exchange`
    },

    async login() {
      if (this.$store.state.chain.scatterConnected) {
        const loading = this.$loading({
          lock: true,
          text: 'Wait for Scatter'
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

<style>
.logo {
  height: 2.5em;
}

.chain-select {
  width: 90px;
}

.scatter-button {
  position: absolute;
  right: 0;
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
    height: 30px;
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
