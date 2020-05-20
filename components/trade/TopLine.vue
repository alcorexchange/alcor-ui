<template lang="pug">
.overflowbox.box-card.p-2
  .row
    .col
      .d-flex.align-items-center(v-if="!isMobile")
        TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="40").ml-2

        .d-flex.ml-3
          b {{ token.symbol.name }}@
          a(:href="monitorAccount(token.contract )" target="_blank") {{ token.contract }}

        .d-flex.ml-3.w-100.justify-content-around
          .d-flex.ml-3
            span Volume 24H:
            span.text-success.ml-1  {{ stats.volume24 | humanFloat(2) }} {{ network.baseToken.symbol }}

          .d-flex.ml-3
            span Change 24H:
            change-percent(:change="stats.change24").ml-2

          .d-flex.ml-3(v-if="!isMobile")
            span Volume 7 Day:
            span.text-success.ml-1  {{ stats.volumeWeek | humanFloat(2) }} {{ network.baseToken.symbol }}

          .d-flex.ml-3(v-if="!isMobile")
            span Change 7 Day:
            change-percent(:change="stats.changeWeek").ml-2
      div(v-else)
        .row.align-items-center
          .col-2
            TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="30").ml-2
          .col-10
            .d-flex.ml-3
              b {{ token.symbol.name }}@
              a(:href="monitorAccount(token.contract )" target="_blank") {{ token.contract }}

        .row
          .col
            .d-flex.ml-3
              span Change 24H:
              change-percent(:change="stats.change24").ml-2
        .row
          .col
            .d-flex.ml-3
              span Volume 24H:
              span.text-success.ml-1  {{ stats.volume24 | humanFloat(2) }} {{ network.baseToken.symbol }}
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: {
    TokenImage,
    ChangePercent
  },

  computed: {
    ...mapState(['network']),
    ...mapState('market', ['token', 'stats'])
  }
}
</script>
