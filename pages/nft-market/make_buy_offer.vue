<template lang="pug">
  .container
    .d-flex.align-items-center.mb-4
      img.pr-2(src='~/assets/icons/transfer_page/Vector_transfer.svg')
      p.font-page-title.p-7.m-0 Make Buy Offer
    .row
      .col-6
        .card-frame
          simpleCard
        el-input.bg-input-black.mt-4(placeholder="Amount of WAX")
        el-input.bg-input-black.my-4(placeholder="Memo")
        h5.mb-2 Historical Price Data (Template based)
        h6.px-2 Lowest Market Listing:
          span.text-success 5400 WAX ($700.12)
        Chart(
          :charts='chartData',
          v-if='chartData.length',
          tab='Price',
          period='24H'
          minHeight='200'
          showPrice=false
        )
        CustomSkeletonVue(v-else, :width='400' :height='150')
        h5.mb-2 Fee Summary
        h6.px-2 Collection Fee: 0%
        h6.px-2 Alcor Fee: 1.00%
        h6.px-2 Tokenomics Fee: 0%
        .row
          .col-5
            el-button.w-100.mt-4(size="large" type="secondary") Buy Listing
          .col-7
            el-button.w-100.mt-4(size="large" type="success") Send Buy Offer
      .col-6
        el-input.bg-input-grey.mb-4(placeholder="Search NFTs" prefix-icon="el-icon-search" v-model="input2")
        el-select.bg-input-grey.mb-4.w-100(v-model="value" large placeholder="Choose Collection")
          el-option(v-for="item in options" :key="item.value" :label="item.label" :value="item.value")
        el-row.mb-4
          el-col.pr-1(:span="12")
            el-input.bg-input-black(placeholder="Min Mint")
          el-col.pl-1(:span="12")
            el-input.bg-input-black(placeholder="Max Mint")
        el-checkbox-group.mb-4(v-model="checkList")
          el-checkbox(size="medium" label="Only Duplicates")
          el-checkbox(label="Only backed NFTs")
          el-checkbox(label="Only whitelisted NFTs")
        .grid-container
          simpleCard.p-2(v-for="item in 9" :key='item')
</template>

<script>
import simpleCard from '~/components/wallet/cards/simpleCard.vue'
import Chart from '~/components/nft_markets/Chart'
import CustomSkeletonVue from '~/components/CustomSkeleton'
export default {
  components: {
    simpleCard,
    Chart,
    CustomSkeletonVue
  },
  data() {
    return {
      options: [
        {
          value: 'Option1',
          label: 'Option1',
        },
        {
          value: 'Option2',
          label: 'Option2',
        },
        {
          value: 'Option3',
          label: 'Option3',
        },
        {
          value: 'Option4',
          label: 'Option4',
        },
        {
          value: 'Option5',
          label: 'Option5',
        },
      ],
      value: '',
      checkList: ['selected and disabled', 'Option A'],
      chartData: ''
    }
  },
  async created() {
    await this.getChartData(441285, "passes", true)
  },
  methods: {
    // get price history for a template for NFT sale chart
    async getChartData(template_id, schema_name, burned) {
      this.chartData = await this.$store.dispatch('api/getChartData', {
        template_id,
        schema_name,
        burned
      })
    }
  }
}
</script>

<style lang="scss">
.bg-input-black .el-input__inner {
  background-color: black;
}
.bg-input-grey .el-input__inner {
  background-color: #333333;
}
</style>
<style lang="scss" scoped>
.grid-container {
    display: grid;
    grid-template-columns: 33.3% 33.3% 33.3%;
    gap: 0px;
  }
.container {
  .font-page-title {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 700;
    font-size: 18px;
    line-height: 21px;
    color: #ffffff;
  }
  .font-label {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    line-height: 21px;
  }
  .card-frame {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #67c23a;
    border-radius: 4px;
    padding: 20px;
  }
}
</style>
