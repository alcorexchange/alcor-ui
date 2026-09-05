<template lang="pug">
TokenInfoPopover(:symbol="symbol" :contract="contract" :disabled="disabled")
  TokenImage(:src="localSrc" v-bind="$attrs")
</template>

<script>
import TokenInfoPopover from '~/components/UI/TokenInfoPopover'
import TokenImage from '~/components/elements/TokenImage'

export default {
  name: 'TokenInfoImage',

  components: {
    TokenInfoPopover,
    TokenImage,
  },

  inheritAttrs: false,

  props: {
    src: {
      type: String,
      default: '',
    },

    disabled: {
      type: Boolean,
    },

    contract: {
      type: String,
      default: '',
    },

    symbol: {
      type: String,
      default: '',
    },
  },

  computed: {
    localSrc() {
      if (this.src) return this.src
      return this.$tokenLogo(this.symbol, this.contract)
    },
  },
}
</script>
