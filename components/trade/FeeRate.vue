<template lang="pug">
.pointer
  el-tooltip.item(
    effect='dark',
    placement='top-start',
    popper-class='popup-dialog'
  )
    template(slot='content')
      span.title.muted {{ $t('Maker Fee') }}
      span.value.ml-1 {{ (meta.fee / 100).toFixed(4) }}%
      span.title.muted.ml-2 {{ $t('Taker Fee') }}
      span.value.ml-1 {{ (meta.fee / 100).toFixed(4) }}%
    el-button.muted.px-1 % {{ $t('Fee') }}

  //el-dropdown(placement="top").fee-rate
    AlcorButton(flat) {{$t('Fee Rate')}}
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
.muted {
  opacity: 1 !important;
}

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
  background: var(--btn-default);
  color: var(--text-default);
  padding: 0px 1px !important;
  margin-top: 3px !important;
  margin-bottom: 3px !important;

  span {
    color: var(--text-default) !important;
  }
}

.popup-fee {
  background-color: black !important;
}

.el-tooltip__popper.is-white {
  display: block;
  background: var(--btn-default) !important;
  color: #fff !important;
  border-radius: 1px solid red;
}

.h-spacer {
  width: 1px;
  background: var(--background-color-secondary);
  margin: 0 8px;
}
</style>
