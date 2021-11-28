<template lang="pug">
footer(:class="{isMobile}").alcor-inner
  //.items
    .item
      a(href="https://github.com/eosrio/Hyperion-History-API" target="_blank").img
        img(src="~/assets/logos/greymass.svg")
      .lead Hyperion by
        a(href="https://eosrio.io/")  EOSRio
      span.mt-2.description.muted
        | The nice tool to get all actions history.
        br
        | All trading graphs and deals history provided by hyperion.
    .item
      a(href="https://github.com/cc32d9/eosio_light_api" target="_blank").img
        img(src="~/assets/logos/lightapi.png")
      .lead EOSIO Light API
      span.mt-2.description.muted
        | The nice tool to get token balances for users.
        br
        | Hosted by
        a(href="https://eosamsterdam.net/" target="_blank")  EOS Amsterdam.
    .item
      a(href="https://bloks.io" target="_blank").img
        img(src="~/assets/logos/bloks_logomark.svg")
      .lead Bloks.io
      span.mt-2.description.muted
        | Is very useful eosio chains explorer.
        br
        | It uses for show all deals history and token contracts.
  span.bottom.muted © 2021 Alcor
  //- .mt-3
  //-   .row.mt-5
  //-     .col-lg-5(v-if="!isMobile")
  //-       img(v-if="$colorMode.value == 'light'" src="~/assets/logos/alcorblack2.svg" height="55").logo
  //-       img(v-else src="~/assets/logos/alcorwhite2.svg" height="55").logo
  //-     .col-lg-2
  //-       ul.nav.footer-column
  //-         li.nav-item
  //-           span.footer-title Community
  //-         li.nav-itek
  //-           a(href="https://twitter.com/alcorexchange" target="_blank")
  //-             img(src="~/assets/icons/tw.svg" height="25").mr-2

  //-           a(href="https://github.com/avral/alcor-ui" target="_blank")
  //-             img(src="~/assets/icons/gh.svg" height="25").mr-2
  //-           a(href="https://t.me/alcorexchange" target="_blank")
  //-             img(src="~/assets/icons/tg.svg" height="25")

  //-     .col-lg-2
  //-       ul.nav.footer-column
  //-         li.nav-item
  //-           span.footer-title Created by
  //-         li.nav-item
  //-           b
  //-             a(href="https://avral.pro" target="_blank")  #Avral

  //-     .col-lg-3
  //-       ul.nav.footer-column
  //-         li.nav-item
  //-           span.footer-title Support & Business offers
  //-         li.nav-itek
  //-           a(href="mailto:admin@alcor.exchange") admin@alcor.exchange

  //-       //span.ml-auto Created by
  //-         b
  //-           a(href="https://avral.pro" target="_blank")  #Avral

  //-   .row.mt-3
  //-     .col.text-mutted
  //-       small
  //-         span.text-muted App version:
  //-           a(href="https://github.com/avral/alcor-ui" target="_blank").text-secondary
  //-             span(v-if="lastCommit.commit")  {{ lastCommit.commit.message }}
  //-             span(v-else)  Latest

  //.row.avral
    .col.d-flex
      span.ml-auto Created by
        b
          a(href="https://avral.pro" target="_blank")  #Avral
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      lastCommit: {}
    }
  },

  async mounted() {
    try {
      this.lastCommit = (
        await axios.get(
          'https://api.github.com/repos/avral/alcor-ui/commits/master'
        )
      ).data
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
footer {
  padding-bottom: 32px;
  padding-top: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  &.isMobile {
    padding-bottom: 84px;
  }
}
.items {
  display: flex;
  .item {
    display: flex;
    flex-direction: column;
    align-self: start;
    flex: 1;
    padding: 8px;
    .img,
    .lead {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }
    img {
      height: 28px;
      object-fit: contain;
    }
    .description {
      text-align: center;
      font-size: 0.86rem;
    }
  }
}
.bottom {
  margin-top: 14px;
}

.avral {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding-right: 5px;
}
@media only screen and (max-width: 840px) {
  .items {
    flex-direction: column;
    .item {
      width: 100%;
      margin-top: 14px;
    }
  }
}
</style>
