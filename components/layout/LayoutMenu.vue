<template lang="pug">
.layout-menu(@keydown="handleKeydown" @focusout="handleFocusout" ref="menu")
  .main
    .start
      .logo
        nuxt-link(:to='localePath("index", $i18n.locale)')
          img.logo(
            :src="require(`~/assets/logos/${$colorMode.value == 'light' ? 'alcorblack' : 'alcorwhite'}.svg`)",
            height='32'
          )
      .menu-items
        template(
          v-for="item in items"
        )
          button.menu-item(
            v-if="item.contentKey"
            @mouseenter="handleItemMouseEnter($event, item.contentKey)"
            @mouseleave="handleItemMouseLeave"
            @click="handleItemClick($event, item.contentKey)"
            :class="{ 'content-active': isOpen && currentContent == item.contentKey, 'active': hasActiveLink(item.contentKey) }"
          )
            span {{ item.name }}
            i.el-icon-caret-bottom
            .new-badge(v-if="item.isNew") New
          nuxt-link.menu-item(v-else :to="localePath(item.to)")
            span {{ item.name }}
    .end
      ConnectNav
  .content-wrapper
    Transition(name="content-container")
      .menu-content-container(
        v-show="isOpen"
        tabindex="-1"
        @mouseenter="handleContentMouseEnter"
        @mouseleave="handleContentMouseLeave"
        ref="contentContainer"
        :style="renderContainerStyle"
      )
        TransitionGroup(:name="`content-${transitionDirection}`" @enter="handleContentEnter" appear)

          template(v-for="section in items.filter((item) => item.contentKey)")
            .menu-content(v-show="currentContent === section.contentKey" :key="section.contentKey")
              ul.content-items(v-for="column in section.content")
                LayoutMenuContentItem(v-for="item in column" :isNew="item.isNew" :title="item.title" :description="item.description" :to="item.to" :href="item.href" :isSocial="item.isSocial" :icon="require(`~/assets/icons/${item.icon}.svg`)")
</template>

<script>
import LayoutMenuContentItem from '~/components/layout/LayoutMenuContentItem.vue'
import ConnectNav from '~/components/layout/ConnectNav'
export default {
  name: 'LayoutMenu',

  components: {
    LayoutMenuContentItem,
    ConnectNav,
  },

  data() {
    return {
      isOpen: false,
      closeTimeout: null,
      size: null,
      resizeObserver: null,
      currentContent: null, // 'trade' | 'earn' | 'bridge' | 'docs'
      contentOffset: null,
      transitionDirection: 'forward', // 'backward'
    }
  },

  computed: {
    renderContainerStyle() {
      return {
        '--content-width': this.size ? `${this.size?.width}px` : 'auto',
        '--content-height': this.size ? `${this.size?.height}px` : 'auto',
        '--content-offset': `${this.contentOffset}px`,
      }
    },
    items() {
      const swap = { name: 'Swap', contentKey: null, to: '/swap' }
      const trade = {
        name: 'Trade',
        contentKey: 'trade',
        // first array is for columns, nested array is for items in each column.
        content: [
          [
            {
              title: 'Spot Market',
              description: 'Trade tokens with advanced orderbooks',
              to: '/markets',
              icon: 'menu-spot',
            },
            {
              title: 'OTC',
              description: 'Trade tokens in bulk',
              to: '/otc',
              icon: 'menu-otc',
            },
            {
              title: 'NFT',
              description: 'Trade, Explore and create NFTs',
              to: '/nft-market',
              icon: 'menu-nft',
            },
          ],
        ],
      }
      const earn = {
        name: 'Earn',
        contentKey: 'earn',
        isNew: false,
        content: [
          [
            {
              title: 'Pools',
              description: 'Manage liquidity pools',
              to: '/positions',
              icon: 'menu-pools',
            },
            {
              title: 'Farms',
              description: 'Stake your liquidity positions in farms',
              to: '/farm',
              icon: 'menu-farms',
            },
          ],
        ],
      }

      // TODO: make symbol based on network
      if (this.$store.state.network.name === 'wax') {
        earn.isNew = true
        earn.content[0].push({
          title: 'Staking',
          description: 'Stake your WAX to earn interest and rewards',
          to: '/staking',
          icon: 'Treasure',
          isNew: true,
        })
      }

      const bridge = {
        name: 'Bridge',
        contentKey: 'bridge',
        content: [
          [
            {
              title: 'IBC Bridge',
              description: 'Bridge from EOS, WAX, Telos and UX Network',
              to: '/bridge',
              icon: 'menu-ibc',
            },
            {
              title: 'Simple Bridge',
              description: 'Use SimpleSwap to buy & swap crypto',
              to: '/buy-crypto',
              icon: 'menu-bridge',
            },
            {
              title: 'WAX Token Bridge',
              description: 'Bridge from Solana, Polygon, Ethereum, BNB and other',
              href: 'https://bridge.mycloudwallet.com',
              icon: 'wcw-bridge',
            },
          ],
        ],
      }
      const docs = {
        name: 'Docs & Socials',
        contentKey: 'docs',
        content: [
          [
            {
              title: 'Docs',
              description: 'Alcor Documentation',
              to: '/docs',
              icon: 'menu-docs',
            },
            {
              title: 'API',
              description: 'Alcor API documentation',
              href: 'http://api.alcor.exchange',
              icon: 'menu-api',
            },
            {
              title: 'Github',
              description: 'Code & Contribution',
              href: 'https://github.com/avral/alcor-ui',
              icon: 'menu-git',
            },
          ],
          [
            {
              title: 'Telegram',
              description: 'Support & Trading Talks',
              href: 'https://t.me/alcorexchange',
              icon: 'Telegram',
              isSocial: true,
            },
            {
              title: 'Twitter',
              description: 'Announcements',
              href: 'https://twitter.com/alcorexchange',
              icon: 'Twitter',
              isSocial: true,
            },
            {
              title: 'Discord',
              description: 'General Chatting',
              href: 'https://discord.gg/Sxum2ETSzq',
              icon: 'Discord',
              isSocial: true,
            },
          ],
        ],
      }
      return [
        swap,
        trade,
        earn,
        { name: 'Analytics', contentKey: null, to: '/analytics' },
        { name: 'Wallet', contentKey: null, to: '/wallet' },
        bridge,
        docs,
      ]
    },
  },

  watch: {
    $route() {
      this.close()
    },
    currentContent(current, previous) {
      if (!current || !previous) {
        this.transitionDirection = 'forward'
        return
      }
      const currentIndex = this.items.findIndex(({ contentKey }) => contentKey === current)
      const previousIndex = this.items.findIndex(({ contentKey }) => contentKey === previous)

      if (currentIndex == -1 || previousIndex == -1) {
        console.log('some index not found', { currentIndex, previousIndex }, { current, previous })
        this.transitionDirection = 'forward'
        return
      }

      if (currentIndex > previousIndex) this.transitionDirection = 'forward'
      else this.transitionDirection = 'backward'
    },
  },

  mounted() {
    this.runResizeObserver()
  },

  methods: {
    hasActiveLink(contentKey) {
      const { path } = this.$route

      // When on /wallet/farms it shows Earn tab as active, this prevents it.
      if (path.includes('/wallet/farms')) return false

      if (contentKey == 'trade') {
        return (
          path.includes('/markets') || path.includes('/trade') || path.includes('/otc') || path.includes('/nft-market')
        )
      }
      if (contentKey == 'earn') {
        return path.includes('/positions') || path.includes('/farm') || path.includes('/staking')
      }
      if (contentKey == 'bridge') {
        return path.includes('/bridge') || path.includes('/buy-crypto')
      }
    },

    open() {
      clearTimeout(this.closeTimeout)
      this.isOpen = true
    },

    close() {
      this.isOpen = false
    },

    delayedClose() {
      clearTimeout(this.closeTimeout)
      this.closeTimeout = setTimeout(() => this.close(), 300)
    },

    handleItemClick(event, content) {
      if (this.isOpen && content === this.currentContent) {
        this.close()
        return
      }
      this.open()
      this.contentOffset = event.currentTarget.offsetLeft
      this.currentContent = content
    },

    handleItemMouseEnter(event, content) {
      this.open()
      this.contentOffset = event.target.offsetLeft
      this.currentContent = content
    },

    handleItemMouseLeave(event) {
      this.delayedClose()
    },

    handleContentMouseEnter() {
      clearTimeout(this.closeTimeout)
    },

    handleContentMouseLeave() {
      this.delayedClose()
    },

    handleContentEnter(el) {
      const rect = el.getBoundingClientRect()
      this.size = {
        width: rect.width,
        height: rect.height,
      }
    },

    handleKeydown(event) {
      const key = event.key

      if (key === 'Escape') {
        this.close()
      }

      // handle focus of sub menu
    },

    handleFocusout(event) {
      if (this.$refs.menu.contains(event.relatedTarget)) {
        return
      }
      this.close()
    },

    runResizeObserver() {
      this.resizeObserver = new ResizeObserver((entries) => {
        console.log(entries)
      })

      // this.resizeObserver.observe(this.$refs.contentContainer)
    },
  },
}
</script>

<style scoped lang="scss">
.layout-menu {
  position: relative;
  z-index: 1000;
  // background: var(--background-color-third);
  .main {
    display: flex;
    justify-content: space-between;
  }
  .start {
    display: flex;
    gap: 18px;
    align-items: center;
  }
  .menu-items {
    display: flex;
    gap: 4px;
    .menu-item {
      background: transparent;
      border: none;
      padding: 6px 12px;
      font-size: 14px;
      border-radius: var(--radius);
      cursor: pointer;
      color: inherit;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-disable);
      position: relative;
      .new-badge {
        position: absolute;
        background: var(--main-action-green);
        padding: 2px 4px;
        line-height: 1;
        border-radius: 4px;
        color: black;
        top: 0;
        right: 0;
        font-size: 0.6rem;
        pointer-events: none;
        transform: translate(20%, -40%);
        z-index: 1;
      }
      &.active {
        color: var(--text-default);
      }
      i {
        transition: transform 0.3s;
      }

      &.content-active {
        background: var(--btn-active);
        i {
          transform: rotate(180deg);
        }
      }

      &:hover {
        background: var(--btn-active);
      }
    }
  }
}

.content-wrapper {
  position: absolute;
  width: 100%;
  left: 0;
  top: 100%;
}
.menu-content-container {
  position: relative;
  background: var(--background-color-secondary);
  border-radius: 8px;
  overflow: hidden;
  width: var(--content-width);
  height: var(--content-height);
  left: var(--content-offset);
  transition: all 0.3s;
  white-space: nowrap;
  // box-shadow: 0 4px 8px rgba(black, 0.5);
  box-shadow: 0 0 0 1px rgba(100, 100, 100, 0.1), var(--dropdown-shadow);
}

.menu-content {
  position: absolute;
  top: 0;
  left: 0;
  width: auto;
  padding: 16px;
  display: flex;
  gap: 40px;
}

.content-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// show transition
.content-container-enter,
.content-container-leave-to {
  opacity: 0;
}

.content {
  // foward transition
  &-forward-enter-active,
  &-forward-leave-active {
    transition: opacity 0.3s, transform 0.3s;
  }

  &-forward-enter {
    opacity: 0;
    transform: translateX(100px);
  }
  &-forward-leave-to {
    opacity: 0;
    transform: translateX(-100px);
  }

  // backward transition
  &-backward-enter-active,
  &-backward-leave-active {
    transition: opacity 0.3s, transform 0.3s;
  }

  &-backward-enter {
    opacity: 0;
    transform: translateX(-100px);
  }
  &-backward-leave-to {
    opacity: 0;
    transform: translateX(100px);
  }
}
</style>
