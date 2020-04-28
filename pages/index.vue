<template lang="pug">
// TODO App need decomposition
.row
  .col
    .jumbotron.mt-2
      h1.display-4 The first listing free decentralized exchange
      p.lead
        span No commissions and
        // TODO courretn contract name show from confing
        a(:href="monitorAccount($store.state.network.contract)" target="_blank").text-primary.strong  FULLY-ONCHAIN
      p
        span  Create markets in one click, list your dapp token for one click, trade whatever you want.
      p.lead
        nuxt-link(to="markets")
          el-button(tag="el-button" type="primary" size="big") Trade now

      hr.my-4

      .display-4.mt-4 Partners
      p.lead.mb-4 Friends and partners of the project. By any collaborations you can send your suggestions to
        a(href="https://t.me/alcorexchange" target="_blank")  telegram chat!

      .row.px-4
        //.col-md-4.p-2
          a(href="https://zenblocks.io" target="_blank")
            img(src="~/assets/logos/zenblocks.png" height=70)

          .lead UI/UX recomendations

        .col-md-4.p-2
          a(href="https://eosnameswaps.com" target="_blank")
            img(src="https://www.eosnameswaps.com/images/ens_logo.jpg" height=70)
          .lead A decentralized EOS account exchange.

        .col-md-4.p-2
          a(href="https://mywish.io/eos-token" target="_blank")
            img(src="~/assets/logos/mywish.svg" height=61)
          .lead.mt-2 Create your own EOS token.

        .col-md-4.p-2
          a(href="https://coffe.io" target="_blank")
            img(src="~/assets/logos/coffe.svg" height=70)

          .lead First integrated eosio chain.

        .col-md-4.p-2
          a(href="https://yusaymon.portfoliobox.net" target="_blank")
            el-avatar(:size="70" src="https://empty")
              img(src="~/assets/logos/yusaymon.jpeg")

          a(href="https://yusaymon.portfoliobox.net" target="_blank")
          .lead The design of the original app logo: @yusaymon
</template>
<style scoped>
.display-4 {
  font-size: 2.5rem;
}

.jumbotron {
  padding: 2rem 2rem;
  background-color: #fafafa;
  margin-bottom: 0px;
}
</style>
