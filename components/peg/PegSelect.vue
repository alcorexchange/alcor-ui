<template lang="pug">
.peg-select-modal.d-flex.align-items-center.gap-8
  .peg-select-button.w100(
    @click='open',
    :class='{ locked, notSelected: !value }'
  )
    .d-flex.align-items-center(v-if='value')
      TokenImage.mr-2(
        :src="$tokenLogo('usdt', 'usdt.alcor')",
        height='25'
      )
      .ft-14 {{ selectedItem.symbol }}
    .d-flex.align-items-center.peg-select-text(v-else) {{ $t('Select') }}
    i.el-icon-arrow-down.ml-auto(v-if='!locked')

  el-dialog(
    :visible='visible',
    @close='visible = false',
    custom-class='select-token-modal',
    :before-close='beforeDialogClose',
    @mousedown.native='dialogMousedown',
    @mouseup.native='dialogMouseup'
  )
    template(#title) {{ $t('Select Currency') }}
    #assets-modal-component
      .d-flex.flex-column.gap-16.px-3.pb-3
        el-input.default.br-6(
          prefix-icon="el-icon-search",
          v-model="search",
          size="small",
          :placeholder="$t('Search')"
          ref="searchInput"
          clearable
        )
        // .popular-tokens
          .popular-token-item.grey-border.border-hover.pointer.d-flex.gap-6(
            v-for="item in popularPegs"
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
        RecycleScroller(
          class="virtual-scroller"
          :items="filteredPegs"
          :item-size="48"
          v-if="filteredPegs.length"
        )
          template(#default="{ item }")
            .token-item.d-flex.justify-content-between.align-items-center.gap-8.pointer.px-2.py-1.br-8.hover-bg-lighter(
              @click='selectAsset(item)'
              :class="{ 'is-selected': selectedItem && item.symbol === selectedItem.symbol }"
            )
              TokenImage(
                :src="$tokenLogo('usdt', 'usdt.alcor')",
                height='28'
              )
              .d-flex.flex-column.gap-2.flex-grow-1
                .contrast {{ item.symbol }}
                .fs-12.disable {{ item.contract }}
              // div.d-flex.flex-column.gap-2.align-items-end
                span {{ item.balance | commaFloat(4) }}
                span.muted.fs-10 ${{ item.balanceUsdValue | commaFloat(4) }}

        .fs-16.text-center(v-if="!filteredPegs.length") {{ $t('No tokens found') }}

</template>

<script>
import ReturnLink from '@/components/ReturnLink'
import TokenImage from '~/components/elements/TokenImage'
export default {
  name: 'PegSelect',

  components: {
    ReturnLink,
    TokenImage,
  },

  props: {
    pegs: { default: () => [] },
    value: { default: null },
    locked: { type: Boolean, default: false },
    w100: { type: Boolean, default: false },
  },

  data: () => ({
    visible: false,

    search: '',
    selected: null,
  }),

  computed: {
    popularPegs() {
      return []
    },
    filteredPegs() {
      return this.pegs?.map((p) => ({ ...p, id: p.symbol })) || []
    },

    selectedItem() {
      return this.pegs.find(({ symbol }) => symbol === this.value)
    },
  },

  methods: {
    open() {
      // if (this.locked) return
      this.visible = true
      this.$nextTick(() => {
        this.$refs.searchInput?.focus()
      })
    },
    selectAsset(v) {
      this.$emit('input', v.symbol)
      this.visible = false
    },
  },
}
</script>

<style lang="scss">
.peg-select-modal {
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

  .peg-select-button {
    display: flex;
    align-items: center;
    padding: 5px 9px;
    border-radius: 8px;
    gap: 8px;
    cursor: pointer;
    background: var(--btn-default);
    transition: all 0.4s;
    img,
    svg {
      width: 16px;
      height: 16px;
    }

    .peg-select-text {
      // color: var(--border-active-color);
    }
    .balance {
      flex-direction: column;
    }
    &:hover {
      border-color: white;
      background: var(--hover);
    }

    &.locked {
      cursor: not-allowed;
      pointer-events: none;
      &.notSelected {
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
    .popular-token-item {
      align-items: center;
      padding: 4px 8px 4px 6px;
      border-radius: 14px;
      transition: all 0.4s;
      &.is-selected {
        border-color: var(--main-action-green) !important;
      }
      &:hover {
        border-color: var(--main-green) !important;
        background: var(--hover);
      }
    }
  }
  .virtual-scroller {
    max-height: 40vh;
  }
  .token-item.is-selected {
    opacity: 0.6;
  }
  .el-input__inner {
    border-radius: 8px;
  }
}
</style>
