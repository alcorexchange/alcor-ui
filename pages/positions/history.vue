<template lang="pug">
div
  PositionHeader
  HistoryList
</template>

<script>
import PositionHeader from '~/components/amm/Position/PositionHeader'
import HistoryList from '~/components/amm/Position/HistoryList'
export default {
  components: {
    PositionHeader,
    HistoryList
  },
}
</script>
