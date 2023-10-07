<template lang="pug">
  no-ssr
    .buy-crypto-widget
      iframe#iframe-widget(:src='widgetSrc' style='height: 356px; width: 100%; border: none')
</template>

<script>
export default {
  fetch({ error, store }) {
    if (!['eos', 'wax'].includes(store.state.network.name)) {
      return error({ statusCode: 404, type: 'PAGE_NOT_FOUND', message: 'This network are not supported' })
    }
  },

  computed: {
    to () {
      return {
        eos: 'eos',
        wax: 'waxp',
      }[this.$store.state.network.name]
    },

    widgetSrc() {
      const params = {
        FAQ: true,
        amount: '10',
        amountFiat: '100',
        backgroundColor: this.$colorMode.value == 'light' ? '#F3FAFC' : '333333',
        //backgroundColor: '#F3FAFC',
        darkMode: true,
        horizontal: false,
        isFiat: false,
        lang: 'en-US',
        link_id: '45eedac1055cac',
        locales: true,
        logo: true,
        primaryColor: '#66c167',
        from: 'usdttrc20',
        fromFiat: 'usd',
        to: this.to,
        toFiat: this.to,
        toTheMoon: true
      }

      return 'https://changenow.io/embeds/exchange-widget/v2/widget.html?' + new URLSearchParams(params).toString()
    },
  },

  head: {
    script: [
      {
        src: 'https://changenow.io/embeds/exchange-widget/v2/stepper-connector.js',
        body: true,
      },
    ],
  }
}
</script>

<style>

.buy-crypto-widget {
  margin-top: 50px;
}
</style>
