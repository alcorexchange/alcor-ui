<template lang="pug">
div
  PositionHeader
  PositionsList(@positionClick="managePosition")
</template>

<script>
import PositionHeader from '~/components/amm/Position/PositionHeader'
import PositionsList from '~/components/amm/Position/PositionsList'

export default {
  components: { PositionsList, PositionHeader },

  methods: {
    async loadPositions() {
      this.positions = await this.$store.dispatch('amm/getPlainPositions')
    },

    managePosition({ link }) {
      console.log({ link })
      this.$router.push(link)
    }
  }
}
</script>
