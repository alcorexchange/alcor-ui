<template lang="pug">
.connect-nav
  .left
    el-dropdown(trigger='click')
      .network-selection
        span EOS MAINNET
        i.el-icon-arrow-down
      template(#dropdown='')
        el-dropdown-menu.dropdown-container
          .d-item item
          .d-item item
          .d-item item
  .right
    .user-detail(v-if='user')
      .balance 1,100 $
      el-dropdown(trigger='click')
        .user-name alcor.ex
        template(#dropdown='')
          el-dropdown-menu.dropdown-container
            .d-item item
            .d-item item
            .d-item item
    AlcorButton.connect-button(
      v-else='',
      @click='$store.dispatch("modal/login")'
    )
      | Connect Wallet
    el-dropdown(trigger='click')
      div
        AlcorButton(:iconOnlyAlt='true')
          i.el-icon-more
      template(#dropdown='')
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
import AlcorButton from '@/components/AlcorButton'
import { mapGetters, mapState } from 'vuex'
// import AlcorLink from '@/components/AlcorLink'
export default {
  components: {
    AlcorButton,
    // AlcorLink
  },
  computed: {
    ...mapGetters(['user']),
  },
  //   props: {
  //     isFooter: {
  //       default: false,
  //       type: Boolean
  //     }
  //   }
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
}
.user-name {
  padding: 4px 8px;
  background: var(--background-color-base);
  border-radius: var(--radius);
  cursor: pointer;
}
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

@media only screen and (max-width: 600px) {
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
