<template lang="pug">
no-ssr
  .mt-2
    h1.fs-20.md-fs-36.text-center Cross Chain Bridges
    .fs-16.md-fs-24.text-center Bridge assets between any chains

    .buy-crypto-widget.d-flex.justify-content-center(v-loading="loading")
      iframe(id="simpleswap-frame" name="SimpleSwap Widget" width="700px" height="500px"
        src="https://simpleswap.io/widget/f3468c8a-b48b-4cbc-a3da-401d6adce21f" frameborder="0")

      //iframe#iframe-widget(:src='widgetSrc' style='height: 356px; width: 100%; border: none')
</template>

<script>
export default {
  fetch({ error, store }) {
    if (!['eos', 'wax'].includes(store.state.network.name)) {
      return error({ statusCode: 404, type: 'PAGE_NOT_FOUND', message: 'This network are not supported' })
    }
  },

  data() {
    return {
      loading: true
    }
  },

  mounted() {
    setTimeout(() => {
      this.loading = false
    }, 2000)
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
  margin-top: 20px;
}
</style>
