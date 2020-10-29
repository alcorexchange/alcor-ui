<template lang="pug">
// TODO Сделать подгрузку инфы о токене с сервиса там о дапах который

.row
  .col
    .row.mb-2(v-if="network.SCAM_CONTRACTS.includes($store.state.market.token.contract)")
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
    ...mapState('market', ['token', 'id', 'stats']),
    ...mapGetters(['user'])
  },

  head() {
    return {
      title: `Alcor Exchange | Market ${this.token.symbol.name}`,

      meta: [
        { hid: 'description', name: 'description', content: `Trade ${this.token.str}/${this.network.baseToken.symbol} onchain, with no fee` },
        { hid: 'og:image', name: 'og:image', content: this.$tokenLogo(this.token.symbol.name, this.token.contract) }
      ]
    }
  }
}
</script>
