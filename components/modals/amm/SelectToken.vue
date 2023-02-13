<template lang="pug">
.select-token-modal
  .select-token-button(@click="visible = true")
    TokenImage(src="/_nuxt/assets/icons/waxtest.png" height="20").mr-1
    .ft-14.mr-1 WAX
    i.el-icon-arrow-down


  el-dialog(
    title="Select Token"
    :visible="visible"
    @close="visible = false"

    custom-class="select-token-modal"

    :before-close="beforeDialogClose"
    @mousedown.native="dialogMousedown"
    @mouseup.native="dialogMouseup"
  )
    //#assets-modal-component
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
import TokenImage from '~/components/elements/TokenImage'


export default {
  components: { AlcorModal, CompactTabs, TokenImage },
  data: () => ({
    visible: false,

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
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'EOS', value: 'eos', coin: 'EOS' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
      { label: 'Solana', value: 'sol', coin: 'SOL' },
      { label: 'MATIC', value: 'matic', coin: 'MATIC' },
      { label: 'pTokens BTC', value: 'pbtc', coin: 'pBTC' },
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
.select-token-modal {
  .el-dialog {
    width: 25%;
    max-width: 400px;
  }
}
</style>
