<template lang="pug">
  no-ssr
    .buy-crypto-widget
      iframe#iframe-widget(:src='widgetSrc' style='height: 356px; width: 100%; border: none')
</template>

<script>
export default {
  computed: {
    widgetSrc() {
      const to = {
        eos: 'eos',
        wax: 'waxp',
      }[this.$store.state.network.name]

      const params = {
        FAQ: 'true',
        amount: '100',
        //amountFiat: '1500',
        //backgroundColor: this.$colorMode.value == 'light' ? '#F3FAFC' : '#212121',
        backgroundColor: '#F3FAFC',
        //darkMode: true,
        darkMode: false,
        from: 'usdttrc',
        //fromFiat: 'eur',
        horizontal: false,
        //isFiat: true,
        lang: 'en-US',
        link_id: '7bfa6da946d248',
        locales: true,
        logo: true,
        primaryColor: '#66c167',
        //to,
        to: 'waxp',
        //toFiat: 'eth',
        toTheMoon: false
      }

      console.log({ params })

      return 'https://changenow.io/embeds/exchange-widget/v2/widget.html' + new URLSearchParams(params).toString()
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
