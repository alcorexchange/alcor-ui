<template lang="pug">
.connect-nav
  .left(v-if="!isMobile").mr-2
    chain-select
  .right
    .user-detail(v-if='user')
      .balance(@click='openInNewTab(monitorAccount(user.name))') {{ systemBalance | commaFloat }}
      el-dropdown
        .user-name {{ user.name }}
          i.el-icon-arrow-down.text-muted.ml-1
        el-dropdown-menu.dropdown-container
          .d-item(@click='logout') Logout
    AlcorButton.connect-button(
      v-else='',
      @click='$store.dispatch("modal/login")'
    )
      | Connect Wallet

    AlcorButton.theme-toggle-button.desktop(
      v-if='$route.name != "index"',
      :icon-only-alt='true',
      @click='$store.dispatch("toggleTheme")'
    )
      i.el-icon-sunny(v-if='$colorMode.value == "dark"')
      i.el-icon-moon(v-else='')

    AlcorButton.theme-toggle-button.desktop.show-settings(
      v-if='$route.name != "index"',
      :icon-only-alt='true',
      @click='showSetting = !showSetting'
    )
      i.el-icon-setting.show-settings(v-if='$colorMode.value == "dark"')
      i.el-icon-setting.show-settings(v-else='')

    settings.settings(v-if='showSetting', v-click-outside='onClickOutside')
    //el-dropdown
      div
        //AlcorButton(:iconOnlyAlt='true')
          i.el-icon-more
      //template(#dropdown='')
        el-dropdown-menu.dropdown-container
          a.d-item
            // <i class="el-icon-help"></i>
            | Help Center
          a.d-item Telegram
          a.d-item Twitter
          a.d-item
            // <i class="el-icon-document"></i>
            | Docs
          AlcorButton.theme-toggle-button.desktop(
            :iconOnlyAlt='true',
            @click='$store.dispatch("toggleTheme")'
          )
            i.el-icon-sunny(v-if='$colorMode.value == "dark"')
            i.el-icon-moon(v-else='')
    AlcorButton.theme-toggle-button.mobile(
      :iconOnlyAlt='true',
      @click='$store.dispatch("toggleTheme")'
    )
      i.el-icon-sunny(v-if='$colorMode.value == "dark"')
      i.el-icon-moon(v-else='')
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import AlcorButton from '@/components/AlcorButton'

import config from '~/config'
import Settings from '~/components/layout/Settings'
import ChainSelect from '~/components/elements/ChainSelect'

export default {
  components: {
    AlcorButton,
    Settings,
    ChainSelect
    // AlcorLink
  },

  data() {
    return {
      loading: false,
      showSetting: false, //to show settings modal
    }
  },

  computed: {
    ...mapGetters(['user', 'systemBalance']),
    ...mapState(['network']),

    current_chain() {
      return this.$store.state.network
    },

    networks() {
      return Object.values(config.networks).filter((n) =>
        ['eos', 'telos', 'wax', 'bos', 'proton'].includes(n.name)
      )
    },
  },
  //   props: {
  //     isFooter: {
  //       default: false,
  //       type: Boolean
  //     }
  //   }
  methods: {
    async logout() {
      await this.$store.dispatch('chain/logout')
    },
    onClickOutside(event) {
      console.log('this is click setting modal:', this.showSetting)
      console.log(event)
      if (this.showSetting) {
        console.log(event)
        this.showSetting = false
      }
    },
    changeChain(chain) {
      // TODO Move to config: APP_DOMAIN
      const location =
        chain == 'wax'
          ? 'https://alcor.exchange/'
          : `https://${chain}.alcor.exchange/`

      this.loading = true
      window.location = location + window.location.pathname.split('/')[1] || ''
    },
  },
}
</script>

<style scoped lang="scss">
.connect-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.right {
  display: flex;
  align-items: center;
}
.theme-toggle-button {
  border-radius: 50% !important;
  margin: 4px 8px;
  margin-right: 0;
  color: var(--text-default) !important;
  &.mobile {
    display: none !important;
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
.connect-button {
  margin: 0 4px;
  height: 36px;
}
.user-detail {
  border-radius: var(--radius);
  background: var(--btn-default);
  display: flex;
  align-items: center;
  padding: 2px;
  margin: 0 4px;
  height: 36px;
}
.balance {
  padding: 4px 8px;
  cursor: pointer;
  // font-size: 0.75rem;
}
.user-name {
  padding: 4px 8px;
  background: var(--background-color-base);
  border-radius: var(--radius);
  cursor: pointer;
  // @media only screen and (max-width: 310px) {
  //   font-size: 0.75rem;
  // }
}

.settings {
  position: absolute;
  top: 60px;
  right: 10px;
  background: var(--btn-default);
  border: 2px solid rgb(63, 63, 63);
  border-radius: 2px;
  z-index: 9;
}

@media only screen and (max-width: 600px) {
  //.connect-nav {
  //  .left {
  //    margin-right: auto;
  //  }
  //}
  .connect-button {
    font-size: 0.8rem;
    padding: 4px;
  }
  .network-selection {
    padding: 4px;
    span {
      font-size: 0.8rem;
    }
    i {
      font-size: 0.8rem;
    }
  }
  .theme-toggle-button {
    &.desktop {
      display: none !important;
    }
    &.mobile {
      display: block !important;
    }
  }
}
</style>
