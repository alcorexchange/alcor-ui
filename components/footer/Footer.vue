<template lang="pug">
footer
  .mt-3
    .row.mt-5
      .col-lg-5(v-if="!isMobile")
        img(v-if="$colorMode.value == 'light'" src="~/assets/logos/alcorblack2.svg" height="55").logo
        img(v-else src="~/assets/logos/alcorwhite2.svg" height="55").logo
      .col-lg-2
        ul.nav.footer-column
          li.nav-item
            span.footer-title Community
          li.nav-itek
            a(href="https://twitter.com/alcorexchange" target="_blank")
              img(src="~/assets/icons/tw.svg" height="25").mr-2

            a(href="https://github.com/avral/alcor-ui" target="_blank")
              img(src="~/assets/icons/gh.svg" height="25").mr-2
            a(href="https://t.me/alcorexchange" target="_blank")
              img(src="~/assets/icons/tg.svg" height="25")

      .col-lg-2
        ul.nav.footer-column
          li.nav-item
            span.footer-title Created by
          li.nav-item
            b
              a(href="https://avral.pro" target="_blank")  #Avral

      .col-lg-3
        ul.nav.footer-column
          li.nav-item
            span.footer-title Support & Business offers
          li.nav-itek
            a(href="mailto:admin@alcor.exchange") admin@alcor.exchange

        //span.ml-auto Created by
          b
            a(href="https://avral.pro" target="_blank")  #Avral


    .row.mt-3
      .col.text-mutted
        small
          span.text-muted App version:
            a(href="https://github.com/avral/alcor-ui" target="_blank").text-secondary
              span(v-if="lastCommit.commit")  {{ lastCommit.commit.message }}
              span(v-else)  Latest

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
      this.lastCommit = (await axios.get('https://api.github.com/repos/avral/alcor-ui/commits/master')).data
    } catch {}
  }
}
</script>

<style lang="scss" scoped>
.logo {
  height: 70px;
}

.avral {
    position: fixed;
    bottom: 0;
    right: 0;
    left: 0;
    padding-right: 5px;
}

ul {
  display: inline-block;
  @media (min-width: 768px) {
    text-align: left;
  }
  //border: yellow solid 1px;
}

.footer-column {
  //text-align: center;
  .nav-item {
    .nav-link {
      padding: 0.1rem 0;
    }
    span.nav-link {
      //color: $link-light-grey;
    }
    span.footer-title {
      color: #808182;
      font-weight: 700;

      //text-transform: uppercase;
    }
    .fas {
      margin-right: 0.5rem;
    }
  }
}
</style>
