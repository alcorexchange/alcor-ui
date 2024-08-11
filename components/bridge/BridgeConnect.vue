<template lang="pug">
.bridge-connect()
  .label {{ hideLabel ? '' : label }}
  .connect
    .beforeConnect {{ hideLabel ? '' : beforeConnect }}
    // not connected
    //- AlcorButton Connect
    // connected
    AlcorButton
      .logged-in-button.fs-14
        .image-container
          img(src="@/assets/icons/eos.png")
        span name
        // TODO: find proper logout icon
        i.el-icon-right
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  components: {
    AlcorButton,
  },
  props: ['label', 'beforeConnect', 'hideLabel', 'message', 'sourceName'],
  computed: {},
  methods: {
    async connectFromWallet() {
      try {
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.sourceName,
          message: this.message,
        })

        this.emit('connect', { wallet, name, authorization })
      } catch (e) {
        this.$notify({
          type: 'warning',
          title: 'Wallet not connected',
          message: e,
        })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.bridge-connect {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.connect {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logged-in-button {
  display: flex;
  align-items: center;
  gap: 6px;
  .image-container {
    width: 16px;
    height: 16px;
    background: var(--background-grid-layout);
    padding: 2px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
}
</style>
