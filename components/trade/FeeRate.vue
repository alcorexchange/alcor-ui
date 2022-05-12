<template lang="pug">
.pointer
  el-tooltip.item(
    effect='white',
    placement='top-start',
    popper-class='popup-dialog'
  )
    template(slot='content')
      span.title.muted Maker Fee
      span.value.ml-1 {{ (meta.fee / 100).toFixed(4) }}%
      span.title.muted.ml-2 Taker Fee
      span.value.ml-1 {{ (meta.fee / 100).toFixed(4) }}%
    el-button.muted.px-1 % Fee

  //el-dropdown(placement="top").fee-rate
    AlcorButton(flat) Fee Rate
    el-dropdown-menu(slot="dropdown").dropdown-content
</template>

<script>
import { mapGetters } from 'vuex'
import AlcorButton from '@/components/AlcorButton.vue'

export default {
  name: 'FeeRate',
  components: {
    AlcorButton,
  },

  computed: {
    ...mapGetters('market', ['meta']),
  },
}
</script>

<style  lang="scss" scoped>
.dropdown-content {
  display: flex;
  padding: 8px;
}
.item {
  display: flex;
  align-items: center;
  .title {
    padding-right: 2px;
  }
}
.el-button.muted {
  font-size: 12px !important;
  background: #3f3f3f;
  padding: 0px 1px !important;
  margin-top: 3px !important;
  margin-bottom: 3px !important;
}
.popup-fee {
  background-color: black !important;
}

.el-tooltip__popper.is-white {
  display: block;
  background: #303133 !important;
  color: #fff !important;
  border-radius: 1px solid red;
}

.h-spacer {
  width: 1px;
  background: var(--background-color-secondary);
  margin: 0 8px;
}
</style>
