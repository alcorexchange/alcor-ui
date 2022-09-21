<template lang="pug">
pre {{ inventory }}

</template>

<script>
export default {
  data: () => ({
    inventory: null
  }),
  mounted() {
    this.getAssets()
  },
  methods: {
    async getAssets() {
      const data = await this.$store.dispatch('api/getAssets', {
        owner: this.$route.params.id
      })

      console.log(data)

      Promise.all(
        data.map(({ asset_id }) =>
          this.$store.dispatch('api/getAssetsSales', { asset_id, buyer: this.$route.params.id }))
      ).then(assetsSales => {
        assetsSales.forEach((sales, idx) =>
          data[idx].purchasePrice = sales.sort((a, b) => b.block_time - a.block_time)[0]
        )
        this.inventory = data
      })
    }
  }
}
</script>
