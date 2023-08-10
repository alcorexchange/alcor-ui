<template lang="pug">
  .farms-page
    FarmHeader(class="mb-2 mt-4")
    FarmsTable
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
}
</script>

<style scoped lang="scss"></style>
