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

  .el-dialog__body {
    padding: 16px;
  }

  .el-dialog__headerbtn {
    width: 40px;
    height: 40px;
    right: 6px;
    top: 6px;

    background: var(--border-color);
    border-radius: 2px;

    &:hover {
      background-color: var(--btn-default);

      .el-dialog__close {
        color: var(--text-dark) !important;
      }
    }
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
