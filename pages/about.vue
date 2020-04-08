<template lang="pug">
  .row
    .col
      .display-4.mt-3 Rules:
      .ml-3.mt-3
        h2.lead With Alcor you can trade any EOS.IO tokens for system EOS tokens,
             | atomically, without the participation of third parties! The tokens should comply with the
             | standard eosio.token of the contract.

        h4 Properties:
          ul.mt-1
            li.lead Fully
              a(:href="monitorAccount('eostokensdex')" target="_blank")  onchain
              |  matching for limit/market trades.
            li.lead All the logic of order storage and matching takes place in the contract's ram, without any additional centralized solutions.
            //li.lead The exchange works automatically, without the possibility of third parties to influence the work of the contract.
            li.lead This application works without centralized back-end and uses only the public EOS node and public api serivices.
            li.lead
              b No commission at all
              |  for beta testing time.
            //li.lead Each exchange is charged a commission of 0.25% for both tokens if the transaction amount is sufficient. Otherwise, for small amounts, no commission will be charged.

      h4.ml-3 Roadmap:
        ul.mt-1
          li.lead Global redesign of the application.
          li.lead The web application will be published in open source. And contract later.
          li.lead Development of additional services for easy search, sorting and working with orders.

      h4.ml-3 Audit:
        ul.mt-1
          li.lead Exchange contract:
            a(:href="monitorAccount('eostokensdex')" target="_blank") eostokensdex
      .row.mb-3
        .col
          .display-4.mt-4 Technologies:

      .row.px-4
        .col-md-4
          a(href="https://github.com/eosrio/Hyperion-History-API" target="_blank").img
            img(src="~/assets/logos/hyperion.png")
          .lead Hyperion by
            a(href="https://eosrio.io/")  EOSRio
          span
            br
            | The nice tool to get all actions history.
            br
            | All trading graphs and deals history provided by hyperion.
        .col-md-4
          a(href="https://github.com/cc32d9/eosio_light_api" target="_blank").img
            img(src="~/assets/logos/lightapi.png" height=80)
          .lead EOSIO Light API
          span.mt-2
            | The nice tool to get token balances for users.
        .col-md-4
          a(href="https://bloks.io" target="_blank").img
            img(src="~/assets/logos/bloks_logomark.svg" height=80)
          .lead Bloks.io
          span.mt-2
            | Is very useful eosio chains explorer.
            br
            | It uses for show all deals history and token contracts.
</template>
