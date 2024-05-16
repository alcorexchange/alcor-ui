<template>
  <transition
    @beforeEnter="beforeEnter"
    @enter="enter"
    @afterEnter="afterEnter"
    @leave="leave"
    name="height-transition"
    :appear="appear"
  >
    <slot />
  </transition>
</template>

<script>
export default {
  name: "HeightTransition",
  props: {
    appear: { default: false },
  },
  methods: {
    beforeEnter(el) {
      el.style.height = 0
    },
    enter(el) {
      const h = el.scrollHeight
      el.style.height = `${h}px`
    },
    afterEnter(el) {
      el.style.height = `auto`
    },
    leave(el) {
      const height = getComputedStyle(el).height
      el.style.height = height
      getComputedStyle(el).height
      el.style.height = 0
    },
  },
}
</script>

<style lang="scss">
.height-transition {
  &-enter-active,
  &-leave-active {
    overflow: hidden;
  }
  &-enter,
  &-leave-to {
    height: 0;
  }
}
</style>
