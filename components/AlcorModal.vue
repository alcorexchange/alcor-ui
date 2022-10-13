<template lang="pug">
el-dialog#alcor-modal-component(
  :visible="visible"
  :before-close="close"
)
  slot
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState('modal', ['visible'])
  },

  methods: {
    close() {
      this.$store.dispatch('modal/closeModal')
    }
  }
}
</script>

<style lang="scss">
#alcor-modal-component {

  .el-dialog__header,
  .el-dialog__body,
  .el-dialog__footer {
    padding: 0;
  }

  .el-dialog {
    border: var(--border-1);
    width: fit-content;
  }

  .el-dialog__headerbtn {
    top: 15px;
    right: 15px;
  }

  .el-dialog__close {
    font-weight: 800;
    color: var(--text-grey-thirdly) !important;
  }
}
</style>
