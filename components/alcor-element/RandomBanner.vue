<template lang="pug">
a.d-flex.banner.w-100.random-banner(:href="activeBanner.link" target="_blank" v-if="activeBanner")
  img.w-100(:src="require(activeBanner.image)")
</template>

<script>
export default {
  props: ['banners'], // Array<{link: string, image: string, colors: string[] }>
  data: () => ({
    randomIndex: undefined
  }),

  computed: {
    activeBanner() {
      return this.banners[this.randomIndex]
    }
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
      console.log(rand)
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
    background: linear-gradient(0deg, rgba(39,46,85,1) 13%, rgba(33,39,68,0.9) 50%, rgba(85,96,229,1) 100%);
    filter: blur(12px);
    transform: translate3d(0px, 16px,-1px);
    border-radius: inherit;
    pointer-events: none;
    opacity: 0.25;
  }
}
</style>
