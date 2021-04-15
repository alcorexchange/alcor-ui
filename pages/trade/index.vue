<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

.row
  .col
    .row
      //.col(v-if="id == 26 && network.name == 'wax'").mb-2
        el-alert(title='TLM Market are closed from 6.04.2021 till 13.04.2021!' type='info' effect='dark')
          .lead Due to the opening of TLM teleport functionality trading is suspended until technical implementation is complete.
      .col(v-if="network.SCAM_CONTRACTS.includes($store.state.market.base_token.contract) || network.SCAM_CONTRACTS.includes($store.state.market.quote_token.contract)")
        .row.mb-2
          .col
            el-alert(type="error" show-icon)
              .lead Potential SCAM token!

    client-only
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

  beforeRouteUpdate(to, from, next) {
    const market = this.$store.state.markets.filter(m => m.slug == from.params.id)[0]
    if (market) this.$store.dispatch('market/unsubscribe', market.id)
    next()
  },

  computed: {
    ...mapState(['network', 'markets']),
    ...mapState('market', ['symbol', 'id', 'stats', 'streaming']),
    ...mapGetters(['user'])
  },

  mounted() {
    if (!this.streaming) {
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
