<template lang="pug">
  .row.mt-3
    .col
      .row.mt-2
        .col
          h2.lead With Alcor you can trade any EOS.IO tokens for system EOS tokens,
               | atomically, without the participation of third parties! The tokens should comply with the
               | standard eosio.token of the contract.

      .row
        .col
          .mt-3
            h4 Properties:
              ul.mt-1
                li.lead Fully
                  a(:href="monitorAccount($store.state.network.contract)" target="_blank")  onchain
                  |  matching for limit/market trades.
                li.lead All the logic of order storage and matching takes place in the contract's ram, without any additional centralized solutions.
                li.lead This application works without centralized back-end and uses only the public EOS node and public api serivices.
                li.lead
                  b No commission at all
                  |  for beta testing time.
      .row.mt-3
        .col
          h1 FAQ
          el-collapse
            el-collapse-item(title='How to add icon for my token ?', name='1')
              p.lead You can add token, options:

              ul
                li.lead Add icon to Eos token collection
                  a(href="https://github.com/eoscafe/eos-airdrops" target="_blank")  https://github.com/eoscafe/eos-airdrops
                li.lead All icon on alcor
                  a(href="https://github.com/avral/alcor-ui/tree/master/assets/tokens" target="_blank")  github page folder
                  |  name format: symbol-contract.png
                li.lead If you cant do any of that,
                  a(href="https://t.me/avral" target="_blank")  send me .png to dm.

            el-collapse-item(title='Audit? How it works?', name='2')
              .lead Exchange contract:
                a(:href="monitorAccount($store.state.network.contract)" target="_blank") {{ $store.state.network.contract }}

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
            br
            | Hosted by
            a(href="https://eosamsterdam.net/" target="_blank")  EOS Amsterdam.
        .col-md-4
          a(href="https://bloks.io" target="_blank").img
            img(src="~/assets/logos/bloks_logomark.svg" height=80)
          .lead Bloks.io
          span.mt-2
            | Is very useful eosio chains explorer.
            br
            | It uses for show all deals history and token contracts.
</template>
