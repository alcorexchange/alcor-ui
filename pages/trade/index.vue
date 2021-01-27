<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

.row
  .col
    .row.mb-2(v-if="network.SCAM_CONTRACTS.includes($store.state.market.base_token.contract) || network.SCAM_CONTRACTS.includes($store.state.market.quote_token.contract)")
      .col
        el-alert(type="error" show-icon)
          .lead Potential SCAM token!

    DesktopTrade(v-if="!isMobile")
    MobileTrade(v-else)
    nuxt-child
</template>

<script>
import { mapGetters, mapState } from 'vuex'

import DesktopTrade from '~/components/trade/DesktopTrade'
import MobileTrade from '~/components/trade/MobileTrade'

export default {
  components: {
    MobileTrade,
    DesktopTrade
  },

  computed: {
    ...mapState(['network', 'markets']),
    ...mapGetters('chain', ['rpc', 'scatter']),
    ...mapState('market', ['symbol', 'id', 'stats', 'streaming']),
    ...mapGetters(['user'])
  },

  mounted() {
    console.log('trade mounted..')
    if (!this.streaming) {
      console.log('not streaming.. set stream')
      this.$store.dispatch('market/startStream', { to: this.id })
    }
  }

  //head() {
  //  return {
  //    title: `Alcor Exchange | Market ${this.symbol}`,

  //    //meta: [
  //    //  {
  //    //    hid: 'description',
  //    //    name: 'description',
  //    //    content: `Trade ${this.symbol} onchain, with no fee`
  //    //  },
  //    //  { hid: 'og:image', name: 'og:image', content: this.$tokenLogo(this.quote_token.symbol.name, this.quote_token.contract) }
  //    //]
  //  }
  //}
}
</script>
