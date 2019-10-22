<template lang="pug">
el-popover(placement="top-start" trigger="hover")
  div(slot="reference")
    TokenImage(slot="reference" :src="$tokenLogo(token.quantity.split(' ')[1], token.contract)" height="25")
    span.ml-2 {{ token.quantity }}
  span.ml-2 {{ token.quantity }}@
    // TODO Refactor this shit
    a(:href="`https://eosflare.io/token/${token.contract}/${token.quantity.split(' ')[1]}`" target="_blank") {{ token.contract }}

</template>


<script>
import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  props: {
    token: {
      type: Object,
      default: () => {}
    }
  }
}
</script>
