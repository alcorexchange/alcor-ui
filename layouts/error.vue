<template lang="pug">
  div.container
    NotFound(v-if="error.statusCode === 404" :error="error" )

    div(v-else)
      .row.justify-content-center
        .col-md-12.text-center
          span.display-1.d-block Error {{ error.statusCode }}
          .mb-4.lead(v-if="error.statusCode === 404 && error.messag == ''") Oops! We can't seem to find the page you are looking for.
          .mb-4.lead(v-else) {{ error.message }}
          nuxt-link(to='/').btn.btn-link Back to Home

</template>

<script>
import NotFound from '~/components/errors/NotFound.vue'


export default {
  components: {
    NotFound
  },

  props: {
    error: {
      type: Object,
      default: () => {}
    }
  },

  layout: 'default'
}
</script>
