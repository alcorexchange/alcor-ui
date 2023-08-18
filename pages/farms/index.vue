<template lang="pug">
  .farms-page
    FarmHeader(class="mb-2 mt-4" @setFinished="setFinished")
    FarmsTable(:finished="finished")
</template>

<script>
import FarmHeader from '@/components/farm/FarmHeader'
import FarmsTable from '@/components/farm/FarmsTable'
export default {
  name: 'FarmsPage',
  components: {
    FarmHeader,
    FarmsTable,
  },

  data: () => {
    return {
      finished: false
    }
  },

  methods: {
    setFinished(finished) {
      this.finished = finished
      console.log({ finished })
    }
  }
}
</script>

<style scoped lang="scss"></style>
