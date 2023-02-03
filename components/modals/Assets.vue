<template lang="pug">
#assets-modal-component
  .header
    .text-center.p-3 Select an asset to bridge
  compact-tabs(:tabs="tabs" :active.sync="tab")
    template(#tab="{ tab: { label, value } }")
      .d-flex.align-items-center.gap-8(v-if="value === 'owned'")
        i.el-icon-wallet
        .fs-14 {{ label }}
      .fs-14(v-else) {{ label }}
  .body
    el-input.search-input(prefix-icon="el-icon-search" v-model='search', size='small', placeholder='Search')
    hr.separator
    .d-flex.flex-column.gap-21
      .d-flex.align-items-center.gap-8.pointer(
        v-for="{ label, value, coin, disabled } in filteredAssets"
        :class="{ disabled }"
        @click="selectAsset(value)"
      )
        img(
          :src='require("~/assets/icons/" + value + ".png")',
          height=16
        )
        span {{ label }} ({{ coin }})
        el-tooltip.op1(v-if="disabled" content="Right Center prompts info" placement="bottom")
          i.el-icon-question

    hr.separator
    .text-center.color-green.pointer Request new token

</template>

<script>
import AlcorModal from '~/components/AlcorModal.vue'
import CompactTabs from '~/components/CompactTabs.vue'

export default {
  components: { AlcorModal, CompactTabs },
  data: () => ({
    search: '',
    tab: 'all',
    tabs: [
      { label: 'Owned', value: 'owned' },
      { label: 'All', value: 'all' }
    ],
    assets: [
      { label: 'Tether', value: 'usdt', coin: 'USDT' },
      { label: 'WAX', value: 'wax', coin: 'WAXP' },
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
      { label: 'Circle USD', value: 'usdc', coin: 'USDC' },
      { label: 'Wrapped Ether', value: 'weth', coin: 'WETH', disabled: true }
    ]
  }),
  computed: {
    filteredAssets() {
      return this.assets.filter(asset => Object.values(asset).join().includes(this.search))
    }
  },
  methods: {
    selectAsset(v) {
      this.$store.commit('setSelectedAsset', v)
      this.$store.dispatch('modal/closeModal')
    }
  }
}
</script>

<style lang="scss">
.search-input {
  width: 288px !important;

  & .el-input__inner {
    border: 1px solid var(--select-color);
    background: var(--select-color) !important;
  }
}
</style>

<style lang="scss" scoped>
#assets-modal-component {
  .body {
    padding: 16px;
  }

  .separator {
    background-color: var(--border-1-color);
  }

  .disabled>*:not(.op1) {
    opacity: 0.35;
  }

}
</style>
