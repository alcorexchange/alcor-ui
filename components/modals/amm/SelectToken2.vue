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
  )
    template(#title) Select Token
    #assets-modal-component
      .d-flex.flex-column.gap-16.px-3.pb-3
        el-input.default.br-6(
          prefix-icon='el-icon-search',
          v-model='search',
          size='small',
          placeholder='Search'
        )
        .popular-tokens
          .popular-token-item.grey-border.border-hover.pointer.d-flex.gap-6(v-for="{ symbol, contract }, i in popularTokens" :key="i" :class="{ 'selected': false }")
            TokenImage(
              :src='$tokenLogo(symbol, contract)',
              height='20'
            )
            .token-name {{ symbol }}

        .d-flex.flex-column.scrollable
          .d-flex.justify-content-between.pointer.p-2.br-8.hover-bg-lighter(
            v-if="filteredAssets.length"
            v-for='({ currency, symbol, contract }, index) in [...filteredAssets, ...filteredAssets, ...filteredAssets, ...filteredAssets]',
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
import ReturnLink from '@/components/ReturnLink'
import TokenImage from '~/components/elements/TokenImage'
import { mapState } from 'vuex'
import { networks } from '@/config'

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
    popularTokens() {
      return networks[this.network.name].popularTokens
    },
    filteredAssets() {
      return this.tokens.filter((asset) =>
        Object.values(asset).join().includes(this.search)
      )
    },
    ...mapState(['network'])
  },
  methods: {
    selectAsset(v) {
      this.$emit('selected', v)
      this.visible = false
    },
  },
}
</script>

<style lang="scss">
.scrollable {
  overflow: auto;
  max-height: 30vh;
}
.select-token-modal {
  border-radius: 1rem !important;
  .el-dialog__header {
    padding: 15px;
  }
  .el-dialog__headerbtn {
    top: 16px !important;
  }

  .el-dialog {
    width: 100%;
    max-width: 400px;
  }
  .el-dialog__body {
    padding: 0px;
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
  
  .popular-tokens {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    .popular-token-item{
      align-items: center;
      padding: 4px 8px 4px 6px;
      border-radius: 14px;
    }
  }
  .input__inner {
    border-radius: 8px;
  }

}
</style>
