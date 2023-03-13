<template lang="pug">
.select-token-modal.d-flex.align-items-center.gap-8
  .select-token-button(
    @click='locked ? "" : (visible = true)',
    :class='{ locked, w100, notSelected: !token }'
  )
    .d-flex.align-items-center(v-if='token')
      TokenImage.mr-2(
        :src='$tokenLogo(token.currency || token.symbol, token.contract)',
        height='25'
      )
      .ft-14 {{ token.currency || token.symbol }}
    .d-flex.align-items-center.select-token-text(v-else) Select token
    i.el-icon-arrow-down.ml-auto(v-if='!locked')

  //append-to-body
  el-dialog(
    :visible='visible',
    @close='visible = false',
    custom-class='select-token-modal',
    :before-close='beforeDialogClose',
    @mousedown.native='dialogMousedown',
    @mouseup.native='dialogMouseup'
    :show-close="false"
  )
    template(#title)
      .d-flex.justify-content-between.align-items-center
        .el-icon-arrow-left.disable.hover-c-contrast.pointer(@click="visible = !visible")
        .fs-18.contrast.justify-self-center Select Token
        span
    #assets-modal-component
      .d-flex.flex-column.gap-16.px-3.pb-3
        el-input.default.br-6(
          prefix-icon='el-icon-search',
          v-model='search',
          size='small',
          placeholder='Search'
        )
        .d-flex.gap-8
          .grey-border.border-hover.pointer.br-4.px-2.py-1.d-flex.gap-4(:class="{ 'border-active': true }")
            TokenImage(
              :src='$tokenLogo("WAX", "eosio.token")',
              height='20'
            )
            .fs-14 WAX
          .grey-border.border-hover.pointer.br-4.px-2.py-1.d-flex.gap-4(:class="{ 'border-active': false }")
            TokenImage(
              :src='$tokenLogo("WAX", "eosio.token")',
              height='20'
            )
            .fs-14 WAX

        .d-flex.flex-column
          .d-flex.justify-content-between.pointer.p-2.br-8.hover-bg-lighter(
            v-if="filteredAssets.length"
            v-for='({ currency, symbol, contract }, index) in filteredAssets',
            @click='selectAsset(tokens[index])'
          )
            .d-flex.align-items-center.gap-8
              TokenImage(
                :src='$tokenLogo(currency || symbol, contract)',
                height='20'
              )
              .d-flex.gap-4.align-items-center
                .fs-14.contrast {{ currency || symbol }}
                .fs-10.disable {{ contract }}
            .fs-14 {{ $tokenBalance(currency || symbol, contract) }}

          .fs-16.text-center(v-if="!filteredAssets.length") No results found.

</template>

<script>
import TokenImage from '~/components/elements/TokenImage'
import ReturnLink from '@/components/ReturnLink'

export default {
  components: { TokenImage, ReturnLink },

  props: {
    tokens: {},
    token: {},
    locked: { type: Boolean, default: false },
    w100: { type: Boolean, default: false },
  },

  data: () => ({
    visible: false,

    search: '',
    selected: null,

  }),
  computed: {
    filteredAssets() {
      return this.tokens.filter((asset) =>
        Object.values(asset).join().includes(this.search)
      )
    },
  },
  methods: {
    selectAsset(v) {
      console.log('vvvv', v)
      this.$emit('selected', v)
      this.visible = false
    },
  },
}
</script>

<style lang="scss">
.select-token-modal {
  border-radius: 1rem !important;
  .el-dialog__header {
    padding: 15px;
  }

  .el-dialog {
    width: 400px;
    max-width: 400px;
  }
  .el-dialog__body {
    padding: 0px;
  }

  hr {
    background: var(--border-color);
  }

  .select-token-button {
    display: flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 8px;
    gap: 8px;
    cursor: pointer;
    background: var(--btn-default);
    transition: all 0.4s;
    color: var(--text-default);
    font-weight: 500;
    img, svg {
      width: 16px;
      height: 16px;
    }
    .select-token-text {
      color: var(--border-active-color);
    }
    &:hover {
      border-color: white;
      background: var(--hover);
    }

    &.locked {
      cursor: not-allowed;
      pointer-events: none;
      &.notSelected{
        opacity: 0.6;
      }
    }
    &.w100 {
      width: 100%;
    }
  }
}
</style>
