<template lang="pug">
  .container
    .d-flex.align-items-center.mb-4
      img.pr-2(src='~/assets/icons/transfer_page/Vector_transfer.svg')
      p.font-page-title.p-7.m-0 Make Buy Offer
    .row
      .col-5
        .card-frame
          customSkeletonVue(v-if='loading', :width='220', :height='325')
          simpleCard(
            v-else,
            v-for='(item, index) in bulkTransfer',
            :key='index',
            :data='item',
            :addTrade="addTrade",
            :mintNum='item.template_mint',
            :collectionName='item.collection.collection_name',
            :immutableName='item.template.immutable_data.name',
            cardWidth="200px"
          )
        el-input.bg-input-black.mt-4(placeholder="Amount of WAX" type="number" v-model='amount_wax')
        el-input.bg-input-black.my-4(placeholder="Memo" v-model='memo')
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
      .col-7
        .d-flex
          el-input.bg-input-grey.my-4.mr-4(
            type='text',
            :value='searchValue',
            @input='debounceSearch',
            @focus='focusInput',
            @blur='blurInput',
            placeholder='Search NFTs',
            prefix-icon='el-icon-search'
            clearable
          )
          el-dropdown.filter-input-group.border-bottom--gray.d-flex.flex-column.justify-content-center(
            trigger='click'
          )
            .el-dropdown-link.d-flex.align-items-center.justify-content-between
              img.me-1(src='~/assets/images/filter.svg', alt='')
              p.m-0 Collections ({{invData.length}})
              i.el-icon-arrow-down.el-icon--right
            el-dropdown-menu.collection-dropdown(slot='dropdown')
              button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
                @click='() => handleCollection("")'
              )
                img(src='~/assets/images/default.png')
                p.ml-1.flex-fill.text-left.collection-name All
              button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
                v-for='(item, index) in invData',
                :key='index',
                @click='() => handleCollection(item.collection.collection_name)'
              )
                img(v-if='item.collection.img && item.collection.img.includes("https://")', :src='item.data.img')
                img(v-else-if='item.collection.img', :src='"https://ipfs.io/ipfs/" + item.data.img')
                img(v-else, src='~/assets/images/default.png')
                p.ml-1.flex-fill.text-left.collection-name {{ item.collection.name }}
        el-row.mb-4
          el-col.pr-1(:span="12")
            el-input.bg-input-black(placeholder="Min Mint")
          el-col.pl-1(:span="12")
            el-input.bg-input-black(placeholder="Max Mint")
        el-checkbox-group.mb-4(v-model="checkList")
          el-checkbox(size="medium" label="Only Duplicates")
          el-checkbox(label="Only backed NFTs")
          el-checkbox(label="Only whitelisted NFTs")
        .grid-container(v-if='loading')
          customSkeletonVue(
            v-for='item in 9',
            :key='item',
            :width='200',
            :height='325'
          )
        .grid-container(v-else)
          simpleCard(
            v-for='(item, index) in invData',
            :key='index',
            :data='item',
            :addTrade="addTrade",
            :cardState="(bulkTransfer.find(data => data.asset_id === item.asset_id) ? 'disable' : 'enable')",
            :mintNum='item.template_mint',
            :collectionName='item.collection.collection_name',
            :immutableName='item.template.immutable_data.name',
            cardWidth="200px"
          )
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
      chartData: '',
      asset_id: 0,
      asset_ids: [],
      assetData: '',
      loading: true,
      invData: [],
      bulkTransfer: [],
      memo: '',
      amount_wax: 0,
      searchValue: '',
    }
  },
  async created() {
    await this.getChartData(441285, "passes", true)
    this.asset_id = this.$route.params.id
    await this.getAssetData()
    if (this.owner) {
      await this.getAssetsInventory(this.owner)
    }
  },
  computed: {
    owner() {
      return this.assetData.owner
    },
    template_mint() {
      if (this.assetData) {
        return this.assetData.template_mint
      } else return '0'
    },
    collectionName() {
      if (this.assetData) {
        return this.assetData.collection.name
      } else return ''
    },
    immutableName() {
      if (this.assetData) {
        return this.assetData.template.immutable_data.name
      } else return ''
    },
  },
  methods: {
    async getChartData(template_id, schema_name, burned) {
      this.chartData = await this.$store.dispatch('api/getChartData', {
        template_id,
        schema_name,
        burned
      })
    },
    debounceSearch(event) {
      this.searchValue = event
      this.handleSearch(event)
    },
    deletebulkTransferItem(id) {
      this.bulkTransfer = this.bulkTransfer.filter((item) => item.asset_id !== id)
    },
    focusInput(event) {
      event.target.parentElement.classList.add('border-bottom--cancel')
    },
    blurInput(event) {
      event.target.parentElement.classList.remove('border-bottom--cancel')
    },
    handleCollection(event) {
      this.currentCollectionName = event
      this.searchCollectionName()
    },
    async searchCollectionName() {
      this.invData = await this.$store.dispatch('api/getAssetsInventory', {
        owner: this.assetData.owner,
        collectionName: this.currentCollectionName
      })
    },
    async handleSearch(key) {
      this.loading = true
      this.invData = await this.$store.dispatch('api/getAssetsInventory', {
        owner: this.assetData.owner,
        search: key,
        collectionName: this.currentCollectionName
      })
      this.loading = false
    },
    addTrade(item, cardState) {
      console.log(item, 'this is addtrade event')
      if (cardState != 'disable' && !this.bulkTransfer.find((data) => data.asset_id === item.asset_id)) {
        this.bulkTransfer.push(item)
        this.asset_ids.push(item.asset_id)
      } else {
        console.log(item, 'this is addtrade event')
        this.bulkTransfer = this.bulkTransfer.filter((data) => data.asset_id !== item.asset_id)
      }
    },
    async getAssetData() {
      this.loading = true
      await this.getSpecificAsset(this.asset_id)
      // this.getAssetsTransfer(this.asset_id)
      // this.getAssetsSales(this.asset_id)
      // this.getAssetsLog(this.asset_id)
      this.loading = false
    },
    async getAssetsInventory(owner) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsInventory', {
        owner,
      })
      this.invData = data
      this.loading = false
      console.log(this.invData, "ddddddd")
    },
    async getSpecificAsset(asset_id) {
      this.loading = true
      const data = await this.$store.dispatch('api/getSpecificAsset', {
        asset_id,
      })
      this.assetData = data
      this.bulkTransfer.push(data)
      this.attributeKeys = Object.keys(data.data)
      this.loading = false
    },
    async transferAsset() {
      if (this.to != '' && this.memo != '') {
        const actions = [
          {
            account: 'atomicassets',
            name: 'transfer',
            authorization: [
              {
                actor: this.assetData.owner,
                permission: 'active',
              },
            ],
            data: {
              from: this.assetData.owner,
              to: this.to,
              asset_ids: this.asset_ids,
              memo: this.memo,
            },
          },
        ]
        try {
          await this.$store.dispatch('chain/sendTransaction', actions)
          this.$notify({
            title: 'Asset Transfer',
            message: 'Asset Transferred!',
            type: 'success',
          })
        } catch (e) {
          this.$notify({
            title: 'Asset Transfer',
            message: e,
            type: 'error',
          })
        } finally {
          this.to = ''
          this.memo = ''
        }
      }
    },
  },
}
</script>

<style lang="scss">
.filter-input-group {
    width: 250px;
  }

  .filter-input-group .search-input {
    width: 80px !important;
  }

  .filter-input,
  .search-input {
    color: var(--cancel);
  }
.el-dropdown-menu.collection-dropdown {
  background: #333;
  border: 1px dashed var(--main-green) !important;
  max-height: 400px;
  width: 250px;
  overflow: auto;

  .btn-collection {
    background-color: transparent;
    height: 37px;
    color: #bec6cb;
    white-space: nowrap;
    overflow: hidden;

    img {
      min-width: 35px;
      width: 35px;
      height: 35px;
      object-fit: contain;
      border-radius: 5px;
    }

    &:hover {
      background-color: rgb(65, 65, 65);
    }

    .collection-name {
      overflow: hidden;
    }
  }
}
.bg-input-black .el-input__inner {
  background-color: black;
}
.bg-input-grey .el-input__inner {
  background-color: #333333;
}
</style>
<style lang="scss" scoped>
.grid-container {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    max-height: 700px;
    overflow: scroll;
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    border: 1px solid #67c23a;
    border-radius: 4px;
    padding: 20px;
    max-height: 700px;
    overflow: scroll;
  }
}
</style>
