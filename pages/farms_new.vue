<template lang="pug">
  .farms-page
    FarmHeader(class="mb-2 mt-4" :finished.sync="finished" @update:finished="finishedUpdate" :stakedOnly.sync="stakedOnly")
    FarmsTable(:finished="finished")
</template>

<script>
import FarmHeader from '@/components/farm/FarmHeader'
import FarmsTable from '@/components/farm/FarmsTable2'
export default {
  name: 'FarmsPage',
  components: {
    FarmHeader,
    FarmsTable,
  },

  data: () => {
    return {
      finished: false,
      stakedOnly: false,
    }
  },

  methods: {
    finishedUpdate() {
      // value is automatically synced with child.
      console.log(this.finished)
    },
  },
}
</script>

<style scoped lang="scss"></style>
