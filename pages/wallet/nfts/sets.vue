<template lang="pug">
#wallet-nfts-sets-page
  .d-flex.flex-wrap.gap-25
    vue-skeleton-loader(
      v-if='loading'
      :width='304',
      :height='315',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    set-card(
      v-else
      v-for='item in sets',
      :key='item.collection_name'
      :data='item',
    )
</template>

<script>
import { mapGetters } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import SetCard from '~/components/cards/SetCard'

export default {
  components: { VueSkeletonLoader, SetCard },
  data: () => ({
    loading: true,
    sets: null,
    userCollections: null
  }),
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    '$route.query'() {
      this.getSets()
    }
  },
  async mounted() {
    await this.getUserCollections()
    this.getSets()
  },
  methods: {
    async getUserCollections() {
      const { collections } = await this.$store.dispatch('api/getAccountSpecificStats', {
        account: this.user.name
      })

      this.userCollections = collections.map(({ collection: { collection_name } }) => collection_name).join(',')
    },
    async getSets() {
      this.loading = true
      this.sets = await this.$store.dispatch('api/getCollections', {
        search: this.$route.query?.match,
        collection_whitelist: this.userCollections
      })
      console.log('ssssss', this.sets)
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-sets-page {
  max-width: 970px;
  margin: 0 auto;
}
</style>
