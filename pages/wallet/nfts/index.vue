<template lang="pug">
#wallet-nfts-inventory-page
  .d-flex.flex-wrap.justify-content-center.justify-content-md-start.gap-25
    vue-skeleton-loader(
      v-if="!inventory.length"
      v-for="idx in [1, 2, 3, 4]"
      :key="idx"
      :width='220',
      :height='397',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )

    inventory-card(v-if="inventory.length" v-for="item in inventory" :key="item.asset_id" :data="item" :ownerName="$store.state.user.name")

</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import InventoryCard from '~/components/cards/InventoryCard'

export default {
  components: { InventoryCard, VueSkeletonLoader },
  data: () => ({
    inventory: [],
    debounce: null
  }),
  computed: {
    ...mapGetters(['user'])
  },
  watch: {
    '$route.query'() {
      this.getInventory()
    }
  },
  mounted() {
    this.getInventory()
  },
  methods: {
    ...mapActions('api', ['getAssets']),
    getInventory() {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(async () => {
        this.inventory = []
        this.inventory = await this.getAssets({
          owner: this.user.name,
          ...this.$route.query
        })
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
#wallet-nfts-inventory-page {
  max-width: 970px;
  margin: 0 auto;
}
</style>
