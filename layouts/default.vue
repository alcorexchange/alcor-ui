<template lang="pug">
div
  ModalsDialog
  .layout
    nav.nav(v-if='!isMobile')
      .nav-side.nav-left
        nuxt-link(to='/')
          img.logo(v-if="$store.state.theme == 'light'" src='~/assets/logos/alcorblack.svg' height='44')
          img.logo(v-else='' height='44' src='~/assets/logos/alcorwhite.svg' alt='')
        ul.nav-items
          li(v-for='item in menuItems' :key='item.index')
            AlcorLink.item(:to='item.index' flat :class="{ active: isActive(item.index) }")
              | {{ item.name }}
      .nav-side.nav-right
        ConnectNav
    .menu-and-menu-header(v-else)
      .menu-header
        .logo
          nuxt-link(to='/')
            img.logo(v-if="$store.state.theme == 'light'" src='~/assets/logos/alcorblack.svg' height='34')
            img.logo(v-else='' height='34' src='~/assets/logos/alcorwhite.svg' alt='')
        AlcorButton.always-dark(@click='openMenu' :icononlyalt='true')
          i.el-icon-more
        nav(:class="['menu', { menuActive }]")
          .logo
            img(v-if="$store.state.theme == 'light'" src='~/assets/logos/alcorblack.svg' height='50')
            img(v-else='' height='50' src='~/assets/logos/alcorwhite.svg' alt='')
          ul.menu-items
            li(v-for='item in menuItems' :key='item.index')
              AlcorLink.item(:to='item.index' flat='')
                | {{ item.name }}
        .menu-underlay(@click='closeMenu' v-if='menuActive')
      .fixed-menu
        ConnectNav
    .main
      nuxt
    FooterBlock
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import config from '~/config'

import ModalsDialog from '~/components/modals/ModalsDialog'
import ChainSelect from '~/components/elements/ChainSelect'
import Footer from '~/components/footer/Footer'
import AlcorButton from '~/components/AlcorButton'
import AlcorLink from '~/components/AlcorLink'
import ConnectNav from '~/components/layout/ConnectNav.vue'

export default {
  components: {
    ModalsDialog,
    // ChainSelect,
    FooterBlock: Footer,
    AlcorLink,
    AlcorButton,
    ConnectNav
  },

  data() {
    return {
      netError: false,

      networks: [],
      current_chain: '',

      app_name: config.APP_NAME,

      menuActive: false
    }
  },

  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'theme']),

    menuItems() {
      const items = []

      if (['eos', 'wax', 'jungle'].includes(this.$store.state.network.name)) {
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
      get() {
        return this.$store.state.chain.payForUser
      },

      set(value) {
        this.$store.commit('chain/setPayForUser', value)
      }
    },

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
    isActive(index) {
      const { path } = this.$route

      if (path.includes('trade') || path.includes('/market')) {
        return index == '/markets'
      }

      return path.includes(index)
    },

    async logout() {
      await this.$store.dispatch('chain/logout')
    },

    openMenu() {
      this.menuActive = true
    },

    closeMenu() {
      this.menuActive = false
    }
  },

  watch: {
    $route() {
      this.closeMenu()
    }
  },

  head() {
    return {
      meta: [
        {
          hid: 'og:image',
          name: 'og:image',
          content: '/android-chrome-512x512.png'
        }
      ]
    }
  }
}
</script>

<style scoped lang="scss">
.layout {
  width: 100%;
  padding: 0 20px;
  max-width: 1200px;
  margin: auto;
  background: var(--background-color-base);
}
.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  .nav-side {
    display: flex;
    align-items: center;
  }
}
.nav-items {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-left: 14px;
  display: flex;
  .item {
    padding: 4px 14px;
    margin-right: 4px;
    &.active {
      background: #161617;
      color: #f2f2f2 !important;
    }
  }
}
.nav-right {
  .network-selection {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px 14px;
    color: var(--text-default);
    span {
      margin-right: 4px;
    }
  }
  .connect-button {
    margin: 0 4px;
  }
}
.d-item {
  display: flex;
  text-align: center;
  padding: 4px 12px;
  min-width: 150px;
  color: var(--text-default);
  cursor: pointer;
  &:hover {
    background: var(--hover);
  }
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
}
.menu {
  position: fixed;
  top: 0;
  right: 0;
}
.menu-underlay {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background: black;
  opacity: 0.5;
  z-index: 238;
}
.menu {
  position: fixed;
  right: -280px;
  top: 0;
  height: 100%;
  width: 260px;
  background: var(--background-color-base);
  z-index: 240;
  box-shadow: 0px 0px 14px 0px rgba(black, 0.4);
  transition: all 0.4s;
  overflow-y: auto;
  .logo {
    padding: 20px 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.menu-items {
  display: flex;
  flex-direction: column;
  .item {
    padding: 4px 14px;
    margin: 2px 8px;
    display: flex;
    &.active {
      background: #161617;
      color: #f2f2f2 !important;
    }
  }
}
.menuActive {
  right: 0px;
}
.fixed-menu {
  background: var(--background-color-base);
  position: fixed;
  box-shadow: 0 0 10px rgba(black, 0.4);
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 8px;
  z-index: 230;
}
</style>

<style lang="scss">
// global - crashes in main.scss
a {
  text-decoration: none !important;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.always-dark {
  background: var(--btn-active) !important;
  color: #f2f2f2 !important;
}
.el-dropdown-menu {
  background: var(--bg-big-card);
  border: 1px solid var(--bg-big-card);
  border-radius: var(--radius-2);
}
.el-popper[x-placement^='bottom'] .popper__arrow::after,
.el-popper[x-placement^='top'] .popper__arrow::after {
  border-bottom-color: var(--bg-big-card);
  border-top-color: var(--bg-big-card);
}
.el-dropdown-selfdefine {
  font-size: 1rem;
  color: var(--text-default);
}
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
    .el-dialog,
    .el-message-box,
    .el-notification {
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
