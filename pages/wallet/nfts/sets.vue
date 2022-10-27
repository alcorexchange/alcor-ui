<template lang="pug">
.d-flex.flex-wrap.gap-25
  vue-skeleton-loader(
    v-if='loading'
    :width='220',
    :height='380',
    animation='wave',
    wave-color='rgba(150, 150, 150, 0.1)',
    :rounded='true',
    v-for='item in 4',
    :key='item'
  )
  set-card(
    v-eles
    v-for='(item, index) in sets',
    :key='index'
    :data='item',
  )
</template>

<script>
import VueSkeletonLoader from 'skeleton-loader-vue'
import SetCard from '~/components/cards/SetCard'

export default {
  components: { VueSkeletonLoader, SetCard },
  data: () => ({ loading: true, sets: null }),
  watch: {
    '$route.query'() {
      this.getCollections()
    }
  },

  mounted() {
    this.getCollections()
  },
  methods: {
    async getCollections() {
      this.loading = true
      this.sets = await this.$store.dispatch('api/getCollections', {
        search: this.$route.query?.match
      })
      this.loading = false
    }
  }
}
</script>
