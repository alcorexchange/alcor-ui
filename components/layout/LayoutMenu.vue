<template lang="pug">
.layout-menu(@keydown="handleKeydown" @focusout="handleFocusout" ref="menu")
  .main
    .start
      .logo LOGO
      .menu-items
        template(
          v-for="item in items"
        )
          button.menu-item(
            v-if="item.contentKey"
            @mouseenter="handleItemMouseEnter($event, item.contentKey)"
            @mouseleave="handleItemMouseLeave"
            @click="handleItemClick($event, item.contentKey)"
            :class="{ active: isOpen && currentContent == item.contentKey }"
          )
            span {{ item.name }}
            i.el-icon-caret-bottom
          button.menu-item(v-else)
            span {{ item.name }}
    .end END
  .content-wrapper
    Transition(name="content-container")
      .menu-content-container(
        v-if="isOpen"
        tabindex="-1"
        @mouseenter="handleContentMouseEnter"
        @mouseleave="handleContentMouseLeave"
        ref="contentContainer"
        :style="renderContainerStyle"
      )
        Transition(name="content" @enter="handleContentEnter" appear)

          .menu-content.trade-content(v-if="currentContent === 'trade'" key="trade")
            LayoutSubMenuItem(title="Spot Markets" description="Trade tokens with advanced orderbooks")
            LayoutSubMenuItem(title="OTC" description="Trade tokens in bulk")
            LayoutSubMenuItem(title="NFT" description="Trade, Explore and create NFTs")

          .menu-content.earn-content(v-if="currentContent === 'earn'" key="earn")
            LayoutSubMenuItem(title="Pools" description="Manage liquidity pools")
            LayoutSubMenuItem(title="Farms" description="Stake your liquidity positions in farms")

          .menu-content.earn-content(v-if="currentContent === 'bridge'" key="bridge")
            LayoutSubMenuItem(title="IBC Bridge" description="Bridge from EOS, WAX, Telos and UX Network")
            LayoutSubMenuItem(title="Simple Bridge" description="Use SimpleSwap to buy crypto")

          .menu-content.earn-content(v-if="currentContent === 'docs'" key="docs")
            LayoutSubMenuItem(title="Docs" description="Alcor Documentation")
            LayoutSubMenuItem(title="API" description="Alcor API documentation")
            LayoutSubMenuItem(title="Github" description="Code & Contribution")
            LayoutSubMenuItem(title="Analytics" description="Alcor Statistics")
</template>

<script>
import LayoutSubMenuItem from '~/components/layout/LayoutSubMenuItem.vue'
export default {
  name: 'LayoutMenu',

  components: {
    LayoutSubMenuItem,
  },

  data() {
    return {
      isOpen: false,
      closeTimeout: null,
      size: null,
      resizeObserver: null,
      currentContent: null, // 'trade' | 'earn'
      contentOffset: null,
      // These are the items that have dropdown content
      items: [
        { name: 'Swap', contentKey: null },
        { name: 'Trade', contentKey: 'trade' },
        { name: 'Earn', contentKey: 'earn' },
        { name: 'Wallet', contentKey: null },
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
  z-index: 100;
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
      border-radius: var(--radius);
      cursor: pointer;
      color: inherit;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 4px;
      i {
        transition: transform 0.3s;
      }

      &.active {
        i {
          transform: rotate(180deg);
        }
      }

      &:hover,
      &:focus {
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
  padding: 10px;
}

.content-container-enter,
.content-container-leave-to {
  opacity: 0;
}

.content-enter-active,
.content-leave-active {
  transition: opacity 0.5s ease;
}
.content-enter,
.content-leave-to {
  opacity: 0;
}
</style>
