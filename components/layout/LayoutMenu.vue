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
            :class="{ 'content-active': isOpen && currentContent == item.contentKey }"
          )
            span {{ item.name }}
            i.el-icon-caret-bottom
          nuxt-link.menu-item(v-else :to="localePath(item.to)")
            span {{ item.name }}
    .end END
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

          .menu-content.trade-content(v-show="currentContent === 'trade'" key="trade")
            ul.content-items
              LayoutMenuContentItem(title="Spot Markets" description="Trade tokens with advanced orderbooks" to="/markets" :icon="require('~/assets/icons/menu-spot.svg')")
              LayoutMenuContentItem(title="OTC" description="Trade tokens in bulk" to="/otc" :icon="require('~/assets/icons/menu-otc.svg')")
              LayoutMenuContentItem(title="NFT" description="Trade, Explore and create NFTs" to="/nft-market" :icon="require('~/assets/icons/menu-nft.svg')")

          .menu-content.earn-content(v-show="currentContent === 'earn'" key="earn")
            ul.content-items
              LayoutMenuContentItem(title="Pools" description="Manage liquidity pools" to="/positions" :icon="require('~/assets/icons/menu-pools.svg')")
              LayoutMenuContentItem(title="Farms" description="Stake your liquidity positions in farms" to="/farm" :icon="require('~/assets/icons/menu-farms.svg')")

          .menu-content.bridge-content(v-show="currentContent === 'bridge'" key="bridge")
            ul.content-items
              LayoutMenuContentItem(title="IBC Bridge" description="Bridge from EOS, WAX, Telos and UX Network" to="/bridge" :icon="require('~/assets/icons/menu-ibc.svg')")
              LayoutMenuContentItem(title="Simple Bridge" description="Use SimpleSwap to buy crypto" to="/buy-crypto" :icon="require('~/assets/icons/menu-bridge.svg')")

          .menu-content.docs-content(v-show="currentContent === 'docs'" key="docs")
            ul.content-items
              LayoutMenuContentItem(title="Docs" description="Alcor Documentation" to="/docs" :icon="require('~/assets/icons/menu-docs.svg')")
              LayoutMenuContentItem(title="API" description="Alcor API documentation" :icon="require('~/assets/icons/menu-api.svg')")
              LayoutMenuContentItem(title="Github" description="Code & Contribution" :icon="require('~/assets/icons/menu-git.svg')")
              LayoutMenuContentItem(title="Analytics" description="Alcor Statistics" to="/analytics" :icon="require('~/assets/icons/menu-analytics.svg')")
            ul.content-items
              LayoutMenuContentItem(title="Telegram" description="Support & Trading Talks" :social="true" :icon="require('~/assets/icons/Telegram.svg')")
              LayoutMenuContentItem(title="Twitter" description="Announcements" :social="true" :icon="require('~/assets/icons/Twitter.svg')")
              LayoutMenuContentItem(title="Discord" description="General Chatting" :social="true" :icon="require('~/assets/icons/Discord.svg')")
</template>

<script>
import LayoutMenuContentItem from '~/components/layout/LayoutMenuContentItem.vue'
export default {
  name: 'LayoutMenu',

  components: {
    LayoutMenuContentItem,
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
      // These are the items that have dropdown content
      items: [
        { name: 'Swap', contentKey: null, to: '/swap' },
        { name: 'Trade', contentKey: 'trade' },
        { name: 'Earn', contentKey: 'earn' },
        { name: 'Wallet', contentKey: null, to: '/wallet' },
        { name: 'Bridge', contentKey: 'bridge' },
        { name: 'Docs & Socials', contentKey: 'docs' },
      ],
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
  },

  watch: {
    $route() {
      this.close()
    },
    currentContent(current, previous) {
      if (!current || !previous) {
        console.log('some item not found')
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
  background: var(--background-color-third);
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
      &.active {
        color: var(--main-action-green);
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
}

.menu-content {
  position: absolute;
  top: 0;
  left: 0;
  width: auto;
  padding: 16px;

  &.docs-content {
    display: flex;
    gap: 40px;
  }
}
.content-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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
