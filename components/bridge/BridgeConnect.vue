<template lang="pug">
.bridge-connect()
  .label {{  label }}
  .connect

    .label(v-if="renderConnectLabel") {{ renderConnectLabel }}

    AlcorButton(v-if="connection" @click="$emit('logout')")
      .logged-in-button.fs-14
        .image-container
          img(:src="require(`@/assets/icons/${network}.png`)")
        span {{ connection.name }}
        // TODO: find proper logout icon
        i.el-icon-right
    AlcorButton(v-else @click="handleConnectClick") Connect
</template>

<script>
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  components: {
    AlcorButton,
  },
  props: [
    'label',
    'connectLabel',

    'dialogMessage',

    // Selected Network
    'network',

    // Wallet connection, { wallet, name, authorization }
    'connection',
  ],
  computed: {
    renderConnectLabel() {
      if (this.connection) return null
      return this.connectLabel
    },
  },
  methods: {
    handleConnectClick() {
      if (!this.network) return
      // TODO: Notify to select chain first
      this.connectWallet()
    },
    async connectWallet() {
      try {
        const { wallet, name, authorization } = await this.$store.dispatch('chain/asyncLogin', {
          chain: this.network,
          message: this.dialogMessage,
        })

        this.$emit('update:connection', { wallet, name, authorization })
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
  .label {
    color: var(--text-disable);
  }
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
.alcor-button {
  padding: 2px 10px !important;
}
</style>
