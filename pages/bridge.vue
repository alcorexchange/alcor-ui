<template lang="pug">
#bridge-page.d-flex.align-items-center.flex-column.gap-16.mt-5
  .greet
    h1.fs-48 Alcor IBC Bridge
    .fs-24 Bridge assets from different chains

  client-only
    bridge-form.mt-4

    circle1(color="#94591C" total="20").circle1
    circle2(color="#462C7E" total="20").circle2
</template>

<script>
import BridgeForm from '~/components/bridge/BridgeForm.vue'
import CirclesBg from '~/components/bridge/CirclesBg.vue'
import Circle1 from '~/components/bridge/Circle1.vue'
import Circle2 from '~/components/bridge/Circle2.vue'

export default {
  components: { BridgeForm, CirclesBg, Circle1, Circle2 },

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
