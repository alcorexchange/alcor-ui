<template lang="pug">
alcor-container.p-4.w-100.chart-container-inner
  .d-flex.justify-content-between
    el-radio-group.custom-radio.p-1.bg-base.br-4(
      v-model='activeTab',
      size='small'
    )
      el-radio-button.pointer(v-for="{ label, value } in tabs" :label='value') {{ label }}

    el-radio-group.custom-radio.p-1.bg-base.br-4(
      v-model='activeTime',
      size='small'
    )
      el-radio-button.pointer(v-for="{ label, value } in times" :label='value') {{ label }}

  .p-absolute
    .d-flex.gap-6.align-items-center.p-relative.t-15
      .indicator.primary
      .fs-20 Swap $2.5 B
      .indicator.secondary
      .fs-20 Spot $2.5 B

  component(:is="activeTab")
</template>

<script>
import StackedColumns from '~/components/charts/StackedColumns'
import Line from '~/components/charts/Line'
import MultiLine from '~/components/charts/MultiLine'
import StepLine from '~/components/charts/StepLine'
import AlcorContainer from '~/components/AlcorContainer'

export default {
  components: {
    Price: Line,
    Tvl: MultiLine,
    Depth: StepLine,
    Volume: StackedColumns,
    Fees: StackedColumns,
    AlcorContainer,
  },
  data: () => ({
    activeTab: 'Price',
    tabs: [
      { label: 'Price', value: 'Price' },
      { label: 'TVL', value: 'Tvl' },
      { label: 'Volume', value: 'Volume' },
      { label: 'Fees', value: 'Fees' },
      { label: 'Depth', value: 'Depth' }
    ],
    activeTime: 'moth',
    times: [
      { label: '1D', value: 'day' },
      { label: '7D', value: 'week' },
      { label: '30D', value: 'moth' },
      { label: 'All', value: 'all' }
    ]
  })

}
</script>

<style scoped lang="scss">
.custom-radio{
  display: flex !important;
  flex-wrap: nowrap;
}
.indicator {
  border-radius: 50%;
  width: 9px;
  height: 9px;
  &.primary {
    background-color: rgb(63, 81, 181);
  }
  &.secondary {
    background-color: rgb(3, 169, 244);
  }
}
</style>
