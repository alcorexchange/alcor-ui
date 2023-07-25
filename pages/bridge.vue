<template lang="pug">
#bridge-page.d-flex.align-items-center.flex-column.gap-16.mt-2
  .greet
    h1.fs-20.md-fs-36.text-center Alcor IBC Bridge
    .fs-16.md-fs-24 Bridge assets from different chains

  client-only
    BridgeForm.mt-2

    circle1(v-if="!isMobile" :color="sourceColor" total="20").circle1
    circle2(v-if="!isMobile" :color="destinationColor" total="20").circle2
</template>

<script>
import BridgeForm from '~/components/bridge/BridgeForm.vue'
import CirclesBg from '~/components/bridge/CirclesBg.vue'
import Circle1 from '~/components/bridge/Circle1.vue'
import Circle2 from '~/components/bridge/Circle2.vue'

const DEFAULT_COLOR = '#575757'

export default {

  name: "BridgePage",

  components: { BridgeForm, CirclesBg, Circle1, Circle2 },

  data: () => ({
    colors: [
      { value: 'eos', color: '#fff' },
      { value: 'proton', color: '#7c30ff' },
      { value: 'telos', color: '#571aff' },
      { value: 'ux', color: '#00e5e5' },
      { value: 'wax', color: '#fa972f' },
    ]
  }),

  computed: {
    sourceColor() {
      const { color } = this.colors.find(c => c.value == this.$store.state.ibcBridge.sourceName) || {}
      return color || DEFAULT_COLOR
    },

    destinationColor() {
      const { color } = this.colors.find(c => c.value == this.$store.state.ibcBridge.destinationName) || {}
      return color || DEFAULT_COLOR
    }
  },

  head() {
    return {
      title: 'Alcor | IBC Bridge',

      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Bridge Antelope assets trustlessly, with no fee!'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.greet {
  z-index: 100
}
#bridge-page {
  position: relative;
}
.circle1 {
  height: 1200px;
  width: 1200px;

  top: -350px;
  left: -650px;
}

.circle2 {
  height: 1200px;
  width: 1200px;

  top: -350px;
  right: -650px;
}

.bg {
  position: absolute;
  top: 50px;
  left: 0px;
}

.bg2 {
  position: absolute;
  top: 50px;
  right: 0px;
}
</style>

<style lang="scss">
.default-layout {
  overflow: hidden;
}
</style>
