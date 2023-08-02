<template lang="pug">
.select-network-modal.flex-1
  .selected(@click="visible = true" :class="{noValue: !value}")
    .image-container
      // FIXME: when setting initially the image does not update!
      img(:src="image" v-if="value" :key="1")
      img(src="@/assets/icons/select_network.png" v-else :key="2")
    .name.fs-10 {{ value || $t('Select Network') }}
  //append-to-body
  el-dialog(
    :visible='visible',
    @close='visible = false',
    custom-class='select-network-modal',
    :before-close='beforeDialogClose',
    @mousedown.native='dialogMousedown',
    @mouseup.native='dialogMouseup'
  )
    template(#title) {{ $t('Select Network') }}
    .networks
      .network.d-flex.flex-column.gap-8(v-for="item in networks" @click="onNetworkClick(item.value)" :class="{active: item.value == value}")
        .image-container
          img(:src="require(`@/assets/icons/${item.value}.png`)")
        span.network-name.fs-10 {{ item.label }}
</template>

<script>
export default {
  components: {},

  props: ['networks', 'value', 'locked'],

  data: () => ({
    visible: false,
  }),

  computed: {
    image() {
      return require(`@/assets/icons/${this.value}.png`)
    }
  },

  methods: {
    open() {
      if (this.locked) return
      this.visible = true
    },
    onNetworkClick(network) {
      this.$emit('input', network)
      this.visible = false
    },
  },
}
</script>

<style lang="scss">
.select-network-modal {
  border-radius: 1rem !important;
  .el-dialog__header {
    padding: 15px;
  }
  .el-dialog__headerbtn {
    top: 16px !important;
  }

  .el-dialog {
    width: 90%;
    max-width: 400px;
  }
  .el-dialog__body {
    padding: 0px;
  }

  .selected {
    display: flex;
    flex-direction: column;
    min-width: 82px;
    align-items: center;
    justify-content: center;
    background: var(--background-color-third);
    padding: 4px;
    gap: 8px;
    border-radius: 6px;
    height: 100%;
    cursor: pointer;
    transition: background 0.2s;
    &:hover {
      background: var(--hover);
    }
    .name {
      text-transform: uppercase;
    }
    &.noValue {
      .name {
        text-transform: none;
      }
      .image-container {
        padding: 0;
      }
    }
  }

  .networks {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    align-items: start;
    min-height: 200px;
    gap: 6px;
    padding: 6px;
  }
  .network {
    align-items: center;
    border-radius: 6px;
    padding: 8px;
    display: flex;
    cursor: pointer;
    &:hover, &.active {
      background: var(--hover);
    }

    @media only screen and (max-width: 360px) {
      padding: 8px 4px;
    }
  }
  .image-container {
    height: 42px;
    width: 42px;
    border-radius: 50%;
    padding: 8px;
    background: var(--background-color-base);
    img {
      width: 100%;
      object-fit: contain;
    }
  }
}
</style>
