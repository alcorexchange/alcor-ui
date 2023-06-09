<template lang="pug">
a.d-flex.banner.w-100.random-banner(
    :href="activeBanner.link"
    target="_blank"
    v-if="activeBanner"
    :style="{ '--color-1': activeBanner.colors[0], '--color-2': activeBanner.colors[1], '--color-3': activeBanner.colors[2] }"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  )
  img.w-100(:src="activeBanner.image")
</template>

<script>
export default {
  props: ['banners'], // Array<{link: string, image: string, colors: string[] x 3 }>
  data: () => ({
    randomIndex: undefined,
    interval: undefined
  }),

  computed: {
    activeBanner() {
      return this.banners[this.randomIndex]
    }
  },

  mounted() {
    this.runInterval()
  },

  beforeDestroy() {
    clearInterval(this.interval)
  },

  watch: {
    banners: {
      handler(current, prev) {
        if (current?.length !== prev?.length)
          this.getRandomNumber()
      },
      immediate: true
    }
  },

  methods: {
    getRandomNumber() {
      const rand = Math.floor(Math.random() * this.banners.length)
      this.randomIndex = rand
    },

    runInterval() {
      clearInterval(this.interval)
      this.interval = setInterval(() => {
        console.log('interval -------------------------------')
        this.increaseIndex()
      }, 6000)
    },

    increaseIndex() {
      if (this.randomIndex == this.banners.length - 1) {
        this.randomIndex = 0 // reset to 0 if on last
        return
      }

      this.randomIndex++
    },

    onMouseEnter() {
      clearInterval(this.interval)
      console.log('enter')
    },

    onMouseLeave() {
      this.runInterval()
      console.log('leave')
    }
  },
}
</script>

<style scoped lang="scss">
.banner {
  margin: 32px 0;
  position: relative;
  transform-style: preserve-3d;
  border: 1px solid rgba(120, 120, 135, 0.36);
  border-radius: 14px;
  img {
    border-radius: 14px;
  }
  &:before {
    content: "";
    position: absolute;
    inset: 0px;
    background: linear-gradient(0deg, var(--color-1) 13%, var(--color-2) 50%, var(--color-3) 100%);
    filter: blur(12px);
    transform: translate3d(0px, 16px,-1px);
    border-radius: inherit;
    pointer-events: none;
    opacity: 0.25;
  }
}
</style>
