<template>
  <div class="layout">
    <nav class="nav">
      <div class="nav-side nav-left">
        <img
          v-if="$store.state.theme == 'light'"
          src="~/assets/logos/alcorblack.svg"
          height="44"
          class="logo"
        />
        <img
          v-else
          class="logo"
          height="44"
          src="~/assets/logos/alcorwhite.svg"
          alt=""
        />
        <ul class="nav-items">
          <li v-for="item in menuItems" :key="item.index">
            <AlcorLink :to="item.index" flat class="item">
              {{ item.name }}
            </AlcorLink>
          </li>
        </ul>
      </div>
      <div class="nav-side nav-right">
        <el-dropdown trigger="click">
          <div class="network-selection">
            <span>EOS MAINNET</span>
            <i class="el-icon-arrow-down"></i>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-container">
              <div class="d-item">item</div>
              <div class="d-item">item</div>
              <div class="d-item">item</div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <AlcorButton class="connect-button">Connect Wallet</AlcorButton>
        <el-dropdown trigger="click">
          <div class="">
            <AlcorButton :iconOnly="true">
              <i class="el-icon-more"></i>
            </AlcorButton>
          </div>
          <template #dropdown>
            <el-dropdown-menu class="dropdown-container">
              <div class="d-item">item</div>
              <div class="d-item">item</div>
              <div class="d-item">item</div>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </nav>
    <div class="main">
      <Nuxt />
    </div>
    <FooterBlock />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import config from '~/config'

import ModalsDialog from '~/components/modals/ModalsDialog'
import ChainSelect from '~/components/elements/ChainSelect'
import Footer from '~/components/footer/Footer'
import AlcorButton from '~/components/AlcorButton'
import AlcorLink from '~/components/AlcorLink'

export default {
  components: {
    // ModalsDialog,
    // ChainSelect,
    // FooterBlock: Footer,
    AlcorLink,
    AlcorButton
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

    activeLink() {
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
      background: var(--btn-active);
    }
  }
}
.nav-right {
  .network-selection {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px 14px;
    color: var(--text);
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
  color: var(--text);
  cursor: pointer;
  &:hover {
    background: var(--hover);
  }
}
</style>

<style lang="scss">
// global - crashes in main.scss
.el-dropdown-menu {
  background: var(--bg-big-card);
  border: 1px solid var(--bg-big-card);
  border-radius: var(--radius-2);
}
.el-popper[x-placement^='bottom'] .popper__arrow::after {
  border-bottom-color: var(--bg-big-card);
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
