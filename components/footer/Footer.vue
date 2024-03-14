<template lang="pug">
footer(:class="{isMobile}").alcor-inner
  .detailed-footer(v-if="showDetailedFooter")
    section.logo-section
      img.logo(:src="require(`~/assets/logos/${$colorMode.value == 'light' ? 'alcorblack' : 'alcorwhite'}.svg`)" height="38")
      span.bottom.muted © {{ new Date().getFullYear()  }} Alcor

    section.general-section(v-for="section in sections")
      .title.muted {{section.title}}
      .items
        .item(v-for="item in section.items")
          component(:is="item.to ? 'nuxt-link' : 'a'" class="fs-14 footer-link" :to="item.to" :href="item.href") {{ item.title }}
    section.contact-section
      .title.muted Contact
      a.avral-link.footer-link(href="https://t.me/avral" target="_blank") @avral
      .title.muted Socials
      .social-items
        a
          img(src="@/assets/icons/Telegram.svg")
        a
          img(src="@/assets/icons/Twitter.svg")
        a
          img(src="@/assets/icons/Discord.svg")
  span.bottom.muted(v-else) © {{ new Date().getFullYear()  }} Alcor
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
      lastCommit: {},
    }
  },

  computed: {
    sections() {
      return [
        {
          title: 'About Us',
          items: [
            { title: 'About', to: '/' },
            { title: 'Blog', to: '/' },
            { title: 'Careers', to: '/' },
          ],
        },
        {
          title: 'Products',
          items: [
            { title: 'Alcor Swap V2', to: '/' },
            { title: 'Alcor Markets', to: '/' },
            { title: 'IBC Bridge', to: '/' },
            { title: 'NFT Marketplace', to: '/' },
            { title: 'Alcor Farms', to: '/' },
          ],
        },
        {
          title: 'Learn',
          items: [
            { title: 'Docs', to: '/' },
            { title: 'Youtube', to: '/' },
            { title: 'Block Producer', to: '/' },
          ],
        },
      ]
    },
    showDetailedFooter() {
      return this.$route.path == '/' && !this.isMobile
    },
  },

  async mounted() {
    try {
      this.lastCommit = (await axios.get('https://api.github.com/repos/avral/alcor-ui/commits/master')).data
    } catch {}
  },
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

.footer-link {
  color: var(--text-default);
  transition: color 0.2s;
  cursor: pointer;
  &:hover {
    color: var(--text-disable);
  }
}

.detailed-footer {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;
  section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    .title {
      font-weight: 500;
      margin-bottom: 16px;
    }
    .items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }
}
.bottom {
  margin-top: 14px;
}
.avral-link {
  margin-bottom: 28px;
}

.social-items {
  display: flex;
  align-items: center;
  gap: 8px;
  img {
    width: 24px;
    height: 24px;
  }
}

.avral {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 0;
  padding-right: 5px;
}
</style>
