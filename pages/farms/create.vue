<template lang="pug">
.farm-create-page
  AlcorContainer(class="alcor-container")
    PageHeader(class="page-header" title="Create Farm")
      template(#end) &nbsp;
    Note(class="mt-2 fs-14") You can only create a farm for a base token that you are the project owner of.

    TokenSelection(class="mt-3")

    FeeTierSelection(:options="feeOptions" class="mt-3"  :value="1")
</template>

<script>
import AlcorContainer from '@/components/AlcorContainer'
import PageHeader from '@/components/amm/PageHeader'
import Note from '@/components/farm/Note'
import TokenSelection from '@/components/farm/TokenSelection'
import FeeTierSelection from '@/components/farm/FeeTierSelection'
export default {
  name: 'CreateFarm',
  components: {
    AlcorContainer,
    PageHeader,
    Note,
    TokenSelection,
    FeeTierSelection,
  },

  data: () => ({
    feeOptions: [{ value: 0.05 }, { value: 0.3 }, { value: 1 }],
  }),
}
</script>

<style lang="scss" scoped>
.farm-create-page {
  padding-top: 60px;
  .alcor-container {
    width: 100%;
    max-width: 600px;
    margin: auto;
  }
}
.page-header {
  flex: 1;
}
</style>

<style lang="scss">
.farm-create-section-title {
  font-size: 18px;
}
</style>
