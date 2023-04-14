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
          .popular-token-item.grey-border.border-hover.pointer.d-flex.gap-6(
            v-for="item in popularTokens"
            :key="item.id"
            :class="{'is-selected': token && item.symbol === token.symbol && item.contract === token.contract}"
            @click='selectAsset(item)'
          )
            TokenImage(
              :src='$tokenLogo(item.symbol, item.contract)',
              height='20'
            )
            .token-name {{ item.symbol }}
        //- .separator
        .d-flex.flex-column.scrollable
          .token-item.d-flex.justify-content-between.align-items-center.gap-8.pointer.px-2.py-1.br-8.hover-bg-lighter(
            v-if="filteredAssets.length"
            v-for='(item, index) in filteredAssets',
            @click='selectAsset(item)'
            :class="{ 'is-selected': token && item.symbol === token.symbol && item.contract === token.contract }"
          )
            TokenImage(
              :src='$tokenLogo(item.currency || item.symbol, item.contract)',
              height='28'
            )
            .d-flex.flex-column.gap-2.flex-grow-1
              .contrast {{ item.currency || item.symbol }}
              .fs-12.disable {{ item.contract }}
            div {{ $tokenBalance(item.currency || item.symbol, item.contract) }}

          .fs-16.text-center(v-if="!filteredAssets.length") No tokens found.

</template>

<script>
import { mapState } from 'vuex'
import ReturnLink from '@/components/ReturnLink'
import TokenImage from '~/components/elements/TokenImage'

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
      const tokens = []
      this.network.popularTokens.map(token => {
        const tInstance = this.tokens?.find(t => token == t.id)

        if (tInstance) tokens.push(tInstance)
      })

      return tokens
    },

    filteredAssets() {
      return this.tokens?.filter((asset) =>
        Object.values(asset).join().toLowerCase().includes(this.search.toLowerCase())
      ) || []
    },

    ...mapState(['network'])
  },

  methods: {
    selectAsset(v) {
      console.log('selectAsset', v)
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
.separator{
  width: 100%;
  border-bottom: 1px solid var(--border-color);
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
    width: 90%;
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
      &.is-selected {
        border-color: var(--main-action-green);
        pointer-events: none;
      }
    }
  }
  .token-item.is-selected{
    opacity: 0.6;
    pointer-events: none;
  }
  .el-input__inner {
    border-radius: 8px;
  }

}
</style>
