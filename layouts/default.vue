<template lang="pug">
.container.mb-5.mt-2
  ModalsDialog
  .row.mb-2
    .col(v-if="!isMobile")
      el-menu(router, :default-active="activeLink", mode='horizontal' theme="dark")
        el-menu-item(index="/")
          img(src="~/assets/logos/alcor_logo.svg").logo

        el-menu-item(index="/markets") Markets

        el-menu-item(index="/nft-market" v-if="$store.state.network.name == 'wax'") NFT Market

        el-menu-item(index="/pools" v-if="$store.state.network.name == 'jungle'") Liquidity pools

        el-menu-item(index="/otc") OTC Swaps

        el-menu-item(index="/about") About

        li.el-menu-item
          img(:src="require('~/assets/icons/' + current_chain + '.png')" height=25).mr-1

          el-select(v-model='current_chain', placeholder='Select', size="small" @change="changeChain").chain-select
            el-option(v-for='network in networks', :key='network.name', :value='network.name')
              img(:src="require('~/assets/icons/' + network.name + '.png')" height=25)
              span.ml-2 {{ network.desc }}

        li.el-menu-item
          el-button(size="small" type="text")
            img(src="/telegram.png" height="30").mr-2
            a.a-reset(href="https://t.me/alcorexchange" target="_blank") Join Telegram chat!

        //li.el-menu-item
          gh-btns-star(slug="avral/alcor-ui" show-count)

        li.el-menu-item(v-if="user").scatter-button
          el-dropdown(size='medium', split-button='' :hide-on-click="false" trigger="click")
            //a(:href="monitorAccount($store.state.user.name)" target="_blank") {{ $store.state.user.name }}
            | {{ $store.state.user.name }}
            el-dropdown-menu(slot='dropdown')
              el-dropdown-item(v-if="network.name == 'eos'")
                .row
                  .col
                    img(src="~/assets/logos/greymassfuel.png" height="30")
                .row
                  .col
                    el-switch(v-model='payForUser' inactive-text=' Free CPU')
                hr
              el-dropdown-item
                el-button(size="mini" type="info" plain @click="logout").w-100 logout

        li.el-menu-item.scatter-button(v-else)
          el-button(@click="$store.dispatch('modal/login')" type="primary" size="small") Connect wallet

    .col(v-else)
      .row
        .col-md-5.mb-1
          nuxt-link(to="/")
            img(src="~/assets/logos/alcor_logo.svg").logo
        .col-sm-5.d-flex.align-items-center
          img(:src="require('~/assets/icons/' + current_chain + '.png')" height=25).mr-1

          el-select(v-model='current_chain', placeholder='Select', size="mini" @change="changeChain").chain-select
            el-option(v-for='network in networks', :key='network.name', :value='network.name')
              img(:src="require('~/assets/icons/' + network.name + '.png')" height=25)
              span.ml-2 {{ network.desc }}

          el-button(size="small" type="text").ml-2
            img(src="/telegram.png" height="30").mr-2
            a.a-reset(href="https://t.me/alcorexchange" target="_blank") Join Telegram chat!

        .scatter-button.mr-1
          div(v-if="user")
            el-dropdown(size='mini', split-button='' :hide-on-click="false" trigger="click")
              //a(:href="monitorAccount($store.state.user.name)" target="_blank") {{ $store.state.user.name }}
              | {{ $store.state.user.name }}
              el-dropdown-menu(slot='dropdown')
                el-dropdown-item(v-if="network.name == 'eos'")
                  .row
                    .col
                      img(src="~/assets/logos/greymassfuel.png" height="30")
                  .row
                    .col
                      el-switch(v-model='payForUser' inactive-text=' Free CPU')
                    hr

                //el-dropdown-item
                  img(:src="require('~/assets/icons/' + current_chain + '.png')" height=25).mr-1

                  el-select(v-model='current_chain', placeholder='Select', size="small" @change="changeChain").chain-select
                    el-option(v-for='network in networks', :key='network.name', :value='network.name')
                      img(:src="require('~/assets/icons/' + network.name + '.png')" height=25)
                      span.ml-2 {{ network.desc }}
                  hr
                el-dropdown-item
                  el-button(size="mini" type="info" plain @click="logout").w-100 logout

          el-button(v-else @click="$store.dispatch('modal/login')" type="primary" size="small") Connect wallet
      .row
        .col
          .row
            .col
              el-menu(router, :default-active="activeLink", mode='horizontal')
                el-menu-item(index="/markets") Markets
                el-menu-item(index="/nft-market" v-if="$store.state.network.name == 'wax'") NFT Market
                el-menu-item(index="/otc") OTC Exchange
                el-menu-item(index="/about") About

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
import axios from 'axios'
import { captureException } from '@sentry/browser'
import { mapGetters, mapState } from 'vuex'

import config from '~/config'

import ModalsDialog from '~/components/modals/ModalsDialog'

export default {
  components: {
    ModalsDialog
  },

  data() {
    return {
      netError: false,
      lastCommit: {},

      networks: [],
      current_chain: '',

      app_name: config.APP_NAME
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network']),

    payForUser: {
      get () {
        return this.$store.state.chain.payForUser
      },

      set (value) {
        this.$store.commit('chain/setPayForUser', value)
      }
    },

    activeLink () {
      if (!this.$route) return

      const paths = this.$route.path.split('/')

      if (paths.length > 2) {
        return '/' + paths[1]
      } else {
        return this.$route.path
      }
    }
  },

  mounted() {
    this.$store.dispatch('checkIsMobile')
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

    changeChain(v) {
      // TODO Move to config: APP_DOMAIN
      if (this.current_chain == 'eos') {
        window.location = `https://alcor.exchange`
        return
      }
      window.location = `https://${this.current_chain}.alcor.exchange`
    },

    async getVersion() {
      this.lastCommit = (await axios.get('https://api.github.com/repos/avral/alcor-ui/commits/master')).data
    }
  },

  head () {
    return {
      meta: [
        { hid: 'og:image', name: 'og:image', content: '/android-chrome-512x512.png' }
      ]
    }
  }
}
</script>

<style scoped>
.el-menu, .el-menu--horizontal {
}

.logo {
  height: 2.5em;
}

.chain-select {
  width: 90px;
}

.scatter-button {
  z-index: 1;
  position: absolute;
  right: 0;
}

.logo-text {
  font-size: 3em;
  font-family: sans-serif;
  font-weight: 100;
}

.el-menu-item {
  display: flex;
  align-items: center;
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

  .el-menu--horizontal .el-menu-item {
    height: 40px;
    line-height: 40px;
  }
}
</style>
