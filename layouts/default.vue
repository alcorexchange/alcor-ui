<template lang="pug">
.mb-5.mt-2(:class="$route.name == 'trade-index-id' ? 'container-fluid' : 'container'" ref="top").top-menu
  ModalsDialog
  .row.mb-2
    .col(v-if="!isMobile")
      .d-flex
        el-menu(router, :default-active="activeLink", mode='horizontal')
          el-menu-item(index="/")
            img(v-if="$store.state.theme == 'light'" src="~/assets/logos/alcorblack.svg").logo
            img(v-else src="~/assets/logos/alcorwhite.svg").logo

          // Menu items
          el-menu-item(v-for= "item in menuItems" :index="item.index") {{ item.name }}

        .d-flex.align-items-center.ml-auto
          chain-select(:current_chain="current_chain").mr-4

          div(v-if="user")
            el-dropdown(size='small', split-button='' :hide-on-click="false" trigger="click")
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

          el-button(v-else @click="$store.dispatch('modal/login')" type="primary" size="small") Connect wallet

          .ml-3
            el-button(v-if="theme == 'dark'" icon="el-icon-sunny" circle size="small" @click="$store.dispatch('toggleTheme')")
            el-button(v-else icon="el-icon-moon" circle size="small" @click="$store.dispatch('toggleTheme')")

    .col(v-else)
      .row
        .col-md-5.mb-1
          .d-flex.align-items-center
            nuxt-link(to="/")
              img(v-if="$store.state.theme == 'light'" src="~/assets/logos/alcorblack.svg" height="55").logo
              img(v-else src="~/assets/logos/alcorwhite.svg").logo

            el-button(size="small" type="text").ml-auto
              img(src="/telegram.png" height="30").mr-2
              a.a-reset(href="https://t.me/alcorexchange" target="_blank") Join Telegram chat!

      .row
        .col
          .row
            .col
              el-menu(router, :default-active="activeLink", mode='horizontal')
                // Menu items
                el-menu-item(v-for= "item in menuItems" :index="item.index") {{ item.name }}

      .fixed-bottom.mobile-bottom
        .row
          .col
            .d-flex.justify-content-around
              .pr-0.login
                el-dropdown(size='small', split-button='' :hide-on-click="false" trigger="click" v-if="user")
                  a(:href="monitorAccount($store.state.user.name)" target="_blank") {{ $store.state.user.name }}
                  //| {{ $store.state.user.name }}
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

                el-button(v-else @click="$store.dispatch('modal/login')" type="primary" size="small") Connect wallet

              .chain-select
                chain-select(:current_chain="current_chain")

              .p-0
                el-button(v-if="theme == 'dark'" icon="el-icon-sunny" circle size="small" @click="$store.dispatch('toggleTheme')")
                el-button(v-else icon="el-icon-moon" circle size="small" @click="$store.dispatch('toggleTheme')")
  nuxt

  FooterBlock

</template>

<script>
import { mapGetters, mapState } from 'vuex'

import config from '~/config'

import ModalsDialog from '~/components/modals/ModalsDialog'
import ChainSelect from '~/components/elements/ChainSelect'
import Footer from '~/components/footer/Footer'

export default {
  components: {
    ModalsDialog,
    ChainSelect,
    FooterBlock: Footer
  },

  data() {
    return {
      netError: false,

      networks: [],
      current_chain: '',

      app_name: config.APP_NAME
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'theme']),

    menuItems() {
      const items = []

      if (['jungle'].includes(this.$store.state.network.name)) {
        items.push({ index: '/swap', name: 'Swap' })
      }

      if (['wax'].includes(this.$store.state.network.name)) {
        items.push({ index: '/swap', name: 'Swap' })
      }

      items.push({ index: '/markets', name: 'Markets' })

      //if (['eos'].includes(this.$store.state.network.name)) {
      //  items.push({ index: '/swap', name: 'Swap' })
      //}

      items.push({ index: '/otc', name: 'OTC' })

      if (['wax', 'eos', 'telos'].includes(this.$store.state.network.name)) {
        items.push({ index: '/nft-market', name: 'NFT' })
      }

      //items.push({ index: '/about', name: 'About' })

      items.push({ index: '/wallet/tokens', name: 'Wallet' })

      items.push({ index: '/docs', name: 'Docs' })

      return items
    },

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

      if (paths.includes('trade')) {
        return '/markets'
      } else if (paths.length > 2) {
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

<style lang="scss">
.top-menu {
  .logo {
    height: 4em;
  }

  .chain-select {
    width: 130px;
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
    padding: 0 16px;
  }

  .el-menu-item:first-child {
    padding-left: 0px;
  }

  h1.lead {
    font-size: 1.2rem;
  }

  @media only screen and (max-width: 600px) {
    .logo {
      height: 35px;
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

  .el-menu.el-menu--horizontal {
    border-bottom: none;
  }
}

.mobile-bottom {
  padding: 6px;
  background: var(--background-color-base);
  box-shadow: 0px 2px 5px #888, 0px 0px 0px #888;

  .login {
    .el-button--small {
      padding: 9px 8px;
    }

    .el-select .el-input__inner {
      padding: 0px;
    }
  }
}
</style>
