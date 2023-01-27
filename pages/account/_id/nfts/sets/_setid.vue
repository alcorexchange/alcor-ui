<template lang="pug">
se
</template>

<script>
import { mapActions } from 'vuex'

export default {
  data: () => ({ set: null, owned: null }),
  mounted() {
    this.getOwned()
    this.getSet()
  },
  methods: {
    ...mapActions('api', ['getOwnedAssets', 'getTemplates']),
    async getSet() {
      const { templates } = await this.getTemplates({
        collection_name: this.$route.params.setid,
        'data:text.rarity': 'Rare'
      })
      this.set = templates
    },
    async getOwned() {
      const { templates } = await this.getOwnedAssets({ collection_name: this.$route.params.setid })
      this.owned = templates.map(({ template_id }) => template_id)
    }
  }
}
</script>
