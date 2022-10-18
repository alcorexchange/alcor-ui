<template lang="pug">
  div.container
    .row.justify-content-center
      .col-md-12.text-center
        image-not-found(v-if="error.type === 'PAGE_NOT_FOUND'" width="280" height="320")
        image404(v-else)
        span.display-1.d-block.error-code Error {{ error.statusCode }}
        .mb-4.lead.message(v-if="error.statusCode === 404 && error.messag == ''") Oops! We can't seem to find the page you are looking for.
        .mb-4.lead.message(v-else) {{ error.message }}
        nuxt-link.link(:to='localePath("index", $i18n.locale)').btn.btn-link Back to Home

</template>

<script>
import ImageNotFound from '~/components/errors/ImageNotFound.vue'
import Image404 from '~/components/errors/Image404.vue'

export default {
  components: {
    ImageNotFound,
    Image404
  },

  props: {
    error: {
      type: Object,
      default: () => { }
    }
  },

  computed: {
    src() {
      console.log('eeee', this.error.statusCode)
      return require(`@/assets/error/${this.error.statusCode === 404 ? 'not-found.png' : 'default.png'}`)
    }
  },


  layout: 'default'
}
</script>

<style scoped>
svg {
  margin-top: 52px;
  margin-bottom: 52px;
}

.error-code {
  font-weight: 400;
  font-size: 3rem;
  line-height: 1.6;
}

.link {
  text-decoration-line: underline !important;
  font-size: 26px;
  color: #007AFF !important;
}

.message {
  font-size: 34px;
  color: var(--text-contast);
}
</style>
