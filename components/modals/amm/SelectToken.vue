<template lang="pug">
.select-token-modal.d-flex.align-items-center.gap-8
  .select-token-button(@click="locked ? '' : visible = true")
    .d-flex.align-items-center(v-if="token")
      TokenImage(:src="$tokenLogo(token.currency || token.symbol, token.contract)" height="25").mr-2
      .ft-14 {{ token.currency || token.symbol }}
    .d-flex.align-items-center(v-else) Select token
    i.el-icon-arrow-down.ml-auto

  //append-to-body
  el-dialog(
    title="Select Token"
    :visible="visible"
    @close="visible = false"

    custom-class="select-token-modal"

    :before-close="beforeDialogClose"
    @mousedown.native="dialogMousedown"
    @mouseup.native="dialogMouseup"
  )

    #assets-modal-component
      compact-tabs(:tabs="tabs" :active.sync="tab")
        template(#tab="{ tab: { label, value } }")
          .d-flex.align-items-center.gap-8(v-if="value === 'owned'")
            i.el-icon-wallet
            .fs-14 {{ label }}
          .fs-14(v-else) {{ label }}

      .body.mt-2.p-3
        el-input(prefix-icon="el-icon-search" v-model='search', size='small', placeholder='Search')
        hr
        .d-flex.flex-column
          .d-flex.align-items-center.gap-8.pointer.p-2.br-8.hover-bg-lighter(
            v-for="({ currency, symbol, contract }, index) in tokens"
            @click="selectAsset(tokens[index])"
          )
            TokenImage(:src="$tokenLogo(currency || symbol, contract)" height="20")

            .d-flex.gap-4.align-items-center
              .fs-14.contrast {{ currency || symbol }}
              .fs-10.disable ({{ contract }})

        hr.separator
        .text-center.color-green.pointer Request new token
</template>

<script>
import AlcorModal from '~/components/AlcorModal.vue'
import CompactTabs from '~/components/CompactTabs.vue'
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: { AlcorModal, CompactTabs, TokenImage },

  props: ['tokens', 'token', 'locked'],

  data: () => ({
    visible: false,

    search: '',
    tab: 'all',
    selected: null,

    tabs: [
      { label: 'Owned', value: 'owned' },
      { label: 'All', value: 'all' }
    ]
  }),
  computed: {
    filteredAssets() {
      return this.assets.filter(asset => Object.values(asset).join().includes(this.search))
    }
  },
  methods: {
    selectAsset(v) {
      this.$emit('selected', v)
      this.visible = false
    }
  }
}
</script>

<style lang="scss">
.select-token-modal {
  .el-dialog {
    width: 400px;
    max-width: 400px;
  }
  .el-dialog__body {
    padding: 0px;
  }
  .body .el-input .el-input__inner {
    background: var(--select-color);
    border-radius: 4px;
  }

  hr {
    background: var(--border-color);
  }

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: white;
    }
  }
}
</style>
