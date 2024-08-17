<template lang="pug">
footer(:class="{ isMobile }").alcor-inner
  template(v-if="showDetailedFooter")

    MobileFooter(v-if="isMobile" :sections="sections")

    .detailed-footer(v-else)
      section.footer-section
        img.logo(:src="require(`~/assets/logos/${$colorMode.value == 'light' ? 'alcorblack' : 'alcorwhite'}.svg`)" height="38")
        .contact-section-item
          .title.muted Socials
          FooterSocialIcons

        GithubButton(href="https://github.com/alcorexchange/alcor-ui" data-color-scheme="no-preference: light; light: light; dark: light;" data-show-count="true" aria-label="Star alcorexchange/alcor-ui on GitHub" class="mb-2") Star

        span.muted © {{ new Date().getFullYear()  }} Alcor

      .column(v-for="col in sections")
        section.footer-section(v-for="section in col")
          .title.muted {{ section.title }}
          .items
            .item(v-for="item in section.items")
              component(:is="item.to ? 'nuxt-link' : 'a'" class="fs-14 footer-link" v-bind="item.to ? { to: localePath(item.to) } : { href: item.href }" :target="item.href ? '_blank' : undefined") {{ item.title }}
    //- section.contact-section
      .contact-section-item
        .title.muted Contact
        .items
          a.item.footer-link.fs-14(href="https://t.me/alcorexchange" target="_blank") tg:alcorexchange
          a.item.footer-link.fs-14(href="mailto:admin@alcor.exchange" target="_blank") admin@alcor.exchange

      .contact-section-item
        .title.muted Request
        .items
          a.item.footer-link.fs-14(href="https://alcor.featurebase.app/" target="_blank") Feature Request
          a.item.footer-link.fs-14(href="https://t.me/Zzullerr" target="_blank") Banner/Ad Request
          a.item.footer-link.fs-14(href="https://t.me/Zzullerr" target="_blank") Business offer

      .contact-section-item
        .title.muted Socials
        .social-items
          a(href="https://t.me/alcorexchange" target="_blank")
            img(src="@/assets/icons/Telegram.svg")
          a(href="https://twitter.com/alcorexchange" target="_blank")
            img(src="@/assets/icons/Twitter.svg")
          a(href="https://discord.gg/Sxum2ETSzq" target="_blank")
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
import GithubButton from 'vue-github-button'
import MobileFooter from './MobileFooter.vue'
import FooterSocialIcons from './FooterSocialIcons.vue'

export default {
  components: {
    MobileFooter,
    FooterSocialIcons,
    GithubButton,
  },
  data() {
    return {
      lastCommit: {},
    }
  },

  computed: {
    // Each item is a column, each item of that is the array of sections
    sections() {
      return [
        [
          {
            title: 'About Us',
            items: [
              { title: 'About', to: '/docs' },
              { title: 'Blog', href: 'https://medium.com/@alcorexchange' },
              { title: 'Careers', to: '/careers' },
            ],
          },
        ],
        [
          {
            title: 'Products',
            items: [
              { title: 'IBC Bridge', to: '/bridge' },
              { title: 'Wax Defi Analytics', href: 'https://grafana.waxtools.net' },
              { title: 'Block Producer', href: 'https://bp.alcor.exchange/' },
            ],
          },
        ],
        [
          {
            title: 'Learn',
            items: [
              { title: 'Api', href: 'http://api.alcor.exchange' },
              { title: 'Docs', to: '/docs' },
              { title: 'Affilate Program', href: 'https://docs.alcor.exchange/alcor-swap/referral-custom-market-fee' },
              { title: 'Contract Audits', href: 'https://www.sentnl.io/audits/alcor-1' },
            ],
          },
        ],
        [
          {
            title: 'Contact',
            items: [
              { title: 'tg:alcorexchange', href: 'https://t.me/alcorexchange' },
              { title: 'admin@alcor.exchange', href: 'mailto:admin@alcor.exchange' },
            ],
          },
          {
            title: 'Request',
            items: [
              { title: 'Feature Request', href: 'https://alcor.featurebase.app/' },
              { title: 'Banner/Ad Request', href: 'https://t.me/Zzullerr' },
              { title: 'Business offer', href: 'https://t.me/Zzullerr' },
            ],
          },
        ],
      ]
    },
    showDetailedFooter() {
      return this.$route.path == this.localePath('/')
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
  max-width: 980px;
  &.isMobile {
    padding-bottom: 84px;
  }
}

.footer-link {
  color: var(--text-disable);
  transition: color 0.2s;
  cursor: pointer;
  &:hover {
    color: var(--text-default);
  }
}

.detailed-footer {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: 100%;

  .footer-section {
    padding-bottom: 16px;
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

.contact-section-item {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
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
