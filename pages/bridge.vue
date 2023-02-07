<template lang="pug">
#bridge-page.d-flex.align-items-center.flex-column.gap-16.mt-5
  circles-bg.bg(stroke="#F89022")
  circles-bg.bg2(stroke="red")
  h1.fs-48 Alcor IBC Bridge
  .fs-24 Bridge assets from different chains

  client-only
    bridge-form.mt-4
</template>

<script>
import BridgeForm from '~/components/bridge/BridgeForm.vue'
import CirclesBg from '~/components/bridge/CirclesBg.vue'

export default {
  components: { BridgeForm, CirclesBg },

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
