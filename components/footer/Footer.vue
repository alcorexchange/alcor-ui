<template lang="pug">
footer
  .container.mt-3
    .row.mt-5
      .col-lg-1
      .col-lg-7
        img(v-if="$store.state.theme == 'light'" src="~/assets/logos/alcorblack2.svg" height="55").logo
        img(v-else src="~/assets/logos/alcorwhite2.svg" height="55")
      .col-lg-4
        ul.nav.footer-column
          li.nav-item
            span.footer-title Community
          li.nav-item
            a(href="https://twitter.com/avral_pro" target="_blank")
              img(src="~/assets/icons/tw.svg" height="25").mr-2

            a(href="https://github.com/avral/alcor-ui" target="_blank")
              img(src="~/assets/icons/gh.svg" height="25").mr-2
            a(href="https://t.me/alcorexchange" target="_blank")
              img(src="~/assets/icons/tg.svg" height="25")

    .row.mt-3
      .col.text-mutted
        small
          span.text-muted App version:
            a(href="https://github.com/avral/alcor-ui" target="_blank").text-secondary
              span(v-if="lastCommit.commit")  {{ lastCommit.commit.message }}

  .row.avral
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
    this.lastCommit = (await axios.get('https://api.github.com/repos/avral/alcor-ui/commits/master')).data
  }
}
</script>

<style lang="scss" scoped>
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
  text-align: center;
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
