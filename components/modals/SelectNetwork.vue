<template lang="pug">
.select-network-modal.flex-1
  .selected(@click="visible = true")
    img(:src="require(`@/assets/icons/${network ? '' : 'select_network'}.png`)")
    .name.fs-10 {{ network ? '' : 'Select Network' }}
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
    #assets-modal-component
      .d-flex.flex-column.gap-16.px-3.pb-3
        div LIST OF NETWORKS
</template>

<script>
import { mapState } from 'vuex'

export default {
  components: {},

  props: ['networks', 'network', 'locked'],

  data: () => ({
    visible: false,
  }),

  computed: {},

  methods: {
    open() {
      if (this.locked) return
      this.visible = true
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
    img {
      height: 42px;
      width: 42px;
    }
    &:hover {
      background: var(--hover);
    }
  }
}
</style>
