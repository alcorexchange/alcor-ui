<template lang="pug">
div
  PositionHeader
  PositionsList(@positionClick='managePosition')
  DepricatedPools
</template>

<script>
import PositionHeader from '~/components/amm/Position/PositionHeader'
import PositionsList from '~/components/amm/Position/PositionsList'
import DepricatedPools from '~/components/amm/Position/DepricatedPools'

export default {
  components: { PositionsList, PositionHeader, DepricatedPools },

  methods: {
    managePosition({ link }) {
      this.$router.push(link)
    },
  },
}
</script>
