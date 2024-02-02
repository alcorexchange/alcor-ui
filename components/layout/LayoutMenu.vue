<template lang="pug">
.layout-menu
  .main
    .start
      .logo LOGO
      .menu-items
        button.menu-item
          span Swap
        button.menu-item(@mouseenter="handleItemMouseEnter($event, 'trade')" @mouseleave="handleItemMouseLeave")
          span Trade
        button.menu-item(@mouseenter="handleItemMouseEnter($event, 'earn')" @mouseleave="handleItemMouseLeave")
          span Earn
    .end END
  .content-wrapper
    Transition(name="content-container")
      .menu-content-container(
        v-if="isOpen"
        @mouseenter="handleContentMouseEnter"
        @mouseleave="handleContentMouseLeave"
        ref="contentContainer"
        :style="renderContainerStyle"
      )
        Transition(name="content" @enter="handleContentEnter" appear)
          .menu-content.trade-content(v-if="currentContent === 'trade'" key="trade") TRADE CONTENT
          .menu-content.earn-content(v-if="currentContent === 'earn'" key="earn")
            .d-flex
              LayoutSubMenuItem(title="Pools" description="Manage liquidity pools")
              LayoutSubMenuItem(title="Farms" description="Stake your liquidity positions in farms")
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

    handleItemMouseEnter(event, content) {
      this.open()
      this.contentOffset = event.target.offsetLeft
      this.currentContent = content
    },

    handleItemMouseLeave(event) {
      this.delayedClose()
    },

    onItemClick() {},

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
