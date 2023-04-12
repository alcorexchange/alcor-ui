<template lang="pug">
nav.nav(v-if='!isMobile')
  .nav-side.nav-left
    nuxt-link(:to='localePath("index", $i18n.locale)')
      img.logo(
        v-if='$colorMode.value == "light"',
        src='~/assets/logos/alcorblack.svg',
        height='32'
      )
      img.logo(
        v-else='',
        height='32',
        src='~/assets/logos/alcorwhite.svg',
        alt=''
      )
    ul.nav-items
      li(v-for='item in menuItems', :key='item.index')
        AlcorLink.item(
          :to='localePath(item.index, $i18n.locale)',
          flat,
          :class='{ active: isActive(item.index) }'
        )
          span {{ $t(item.name) }}
          new-badge.badge(v-if='item.new', width='44', height='32')

  .nav-side.nav-right
    ConnectNav
.menu-and-menu-header(v-else)
  .menu-header
    .logo
      nuxt-link(:to='localePath("index", $i18n.locale)')
        img.logo(
          v-if='$colorMode.value == "light"',
          src='~/assets/logos/alcorblack.svg',
          height='34'
        )
        img.logo(
          v-else='',
          height='34',
          src='~/assets/logos/alcorwhite.svg',
          alt=''
        )

    .mobile-chain-select
      chain-select

    AlcorButton(:icon-only-alt='true', @click='showSetting = !showSetting')
      i.el-icon-setting.show-settings

    settings.settings(v-if='showSetting', v-click-outside='onClickOutside')

    AlcorButton(@click='openMenu', :icon-only-alt='true')
      i.el-icon-more
    nav(:class='["menu", { menuActive }]')
      .logo
        img(
          v-if='$colorMode.value == "light"',
          src='~/assets/logos/alcorblack.svg',
          height='50'
        )
        img(
          v-else='',
          height='50',
          src='~/assets/logos/alcorwhite.svg',
          alt=''
        )
      ul.menu-items
        li(v-for='item in menuItems', :key='item.index')
          AlcorLink.item(:to='item.index', flat='')
            | {{ item.name }}
    .menu-underlay(@click='closeMenu', v-if='menuActive')
  .fixed-menu
    ConnectNav
</template>

<script>
import AlcorButton from '~/components/AlcorButton'
import AlcorLink from '~/components/AlcorLink'
import ConnectNav from '~/components/layout/ConnectNav'
import ChainSelect from '~/components/elements/ChainSelect'
import Settings from '~/components/layout/Settings'
import NewBadge from '~/components/svg-icons/NewBadge.vue'

export default {
  components: {
    AlcorLink,
    AlcorButton,
    ConnectNav,
    ChainSelect,
    Settings,
    NewBadge,
  },

  data() {
    return {
      menuActive: false,
      showSetting: false,
    }
  },

  computed: {
    menuItems() {
      const items = []

      if (['wax'].includes(this.$store.state.network.name)) {
        items.push({ index: '/swap', name: 'Swap', new: true })
      }

      items.push({ index: '/positions', name: 'Pool' })

      if (
        ['eos', 'wax', 'jungle', 'telos', 'local', 'waxtest'].includes(
          this.$store.state.network.name
        )
      ) {
        items.push({ index: '/swp_old', name: 'Swap v1' })
      }


      items.push({ index: '/markets', name: 'Markets' })
      items.push({ index: '/bridge', name: 'Bridge' })

      items.push({ index: '/otc', name: 'OTC' })

      if (['wax'].includes(this.$store.state.network.name)) {
        // TODO Add atomic on eos
        items.push({ index: '/nft-market', name: 'NFT' })
      }

      items.push({ index: '/wallet', name: 'Wallet' })
      items.push({ index: '/docs', name: 'Docs' })

      return items
    },
  },

  watch: {
    $route() {
      this.closeMenu()
    },
  },

  methods: {
    onClickOutside(event) {
      if (this.showSetting) {
        this.showSetting = false
      }
    },

    isActive(index) {
      const { path } = this.$route

      if (path.includes('trade') || path.includes('/market')) {
        return index == '/markets'
      }

      return path.includes(index)
    },

    openMenu() {
      this.menuActive = true
    },

    closeMenu() {
      this.menuActive = false
    },
  },
}
</script>

<style scoped lang="scss">
.alcor-button {
  height: 26px;
}

.settings {
  position: absolute;
  top: 50px;
  right: 0px;
  background: var(--table-background);
  border: var(--border-2);
  border-radius: 2px;
  z-index: 9;
}

.mobile-chain-select {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 10px;
}

.layout {
  background: var(--background-color-base);
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  position: relative;

  .nav-side {
    display: flex;
    align-items: center;
  }

  .nav-left {
    width: 100%;
    max-width: 700px;
  }

  @media only screen and (max-width: 1300px) {
    .nav-left {
      max-width: 620px;
    }
  }
}

.full-width {
  max-width: 1920px;
  padding: 0px;

  .nav {
    padding: 12px 20px;
  }
}

.nav-items {
  list-style: none;
  margin: 0;
  padding: 0;
  margin-left: 14px;
  display: flex;
  justify-content: space-around;
  width: 100%;

  .item {
    padding: 4px 10px;
    margin-right: 4px;
    display: flex;
    align-items: center;
    color: var(--text-disable);
    position: relative;
    &:hover {
      color: var(--text-default)
    }

    .badge {
      position: absolute;
      bottom: 12px;
      left: 28px;
      z-index: 1;
    }

    &.active {
      background: var(--btn-active);
      color: var(--text-contrast) !important;
    }
  }
}

.menu-header {
  display: flex;
  //justify-content: space-between;
  align-items: center;
  padding: 8px;
  gap: 5px;
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
      background: var(--btn-active);
      color: var(--text-default) !important;
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
