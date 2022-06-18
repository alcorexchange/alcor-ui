<template lang='pug'>
  .tradeoffer
    .nft-container.j-container
      .row
        .col-6.d-flex.align-items-center
          //- img.flfum-img(src='~/assets/images/small_shape.svg')
          p.p-7.mb-0 {{userName}}
        .col-6.d-flex
          //- img(src="../../assets/images/small_shape_gradient.svg")
          input.recipient_name(placeholder='Recipient Name', @input="debounceSearch")
    .row
      .col-6.p-4
        .row.nft-create-section
          .col-4.py-2.text-center.p-1(v-for='(item, index) in myTrade' :key='index')
            .create-section-item.d-flex.flex-column.justify-content-between
              video.main-img.radius10(v-if='item.data && item.data.video', autoplay='true', loop='true')
                source(
                  :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + item.data.video + "&size=370&output=mp4"',
                  type='video/mp4'
                )
              .main-img.radius10(v-else-if='item.data && item.data.img', :style="{backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: item.data.img.includes('https://') ? item.data.img : 'url(https://ipfs.atomichub.io/ipfs/' + item.data.img + ')'}")
              .main-img.radius10(v-else, :style='defaultBackground')
              p.section-item_name.mb-0 {{item['name']}}
              span.cross-btn(@click="deleteMyTradeItem(item.asset_id)" :style="{ backgroundImage:`url(${require('~/assets/images/cross.svg')})`}")
      .col-6.p-4
        .row.nft-create-section
          .col-4.py-2.text-center.p-1(v-for='(item, index) in theirTrade' :key='index')
            .create-section-item.d-flex.flex-column.justify-content-between
              video.main-img.radius10(v-if='item.data && item.data.video', autoplay='true', loop='true')
                source(
                  :src='"https://resizer.atomichub.io/videos/v1/preview?ipfs=" + item.data.video + "&size=370&output=mp4"',
                  type='video/mp4'
                )
              .main-img.radius10(v-else-if='item.data && item.data.img', :style="{backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: item.data.img.includes('https://') ? item.data.img : 'url(https://ipfs.atomichub.io/ipfs/' + item.data.img + ')'}")
              .main-img.radius10(v-else, :style='defaultBackground')
              p.section-item_name.mb-0 {{item['name']}}
              span.cross-btn(@click="deleteTheirTradeItem(item.asset_id)" :style="{ backgroundImage:`url(${require('~/assets/images/cross.svg')})`}")
    TradeofferTab(:data='data' :currentTab='currentTab' :handleTab='handleTab', :handleSearch='handleSearch', :collectionData='collectionData', :handleCollection='handleCollection', :sendTradeOffer="sendTradeOffer")
    .grid-container(v-if='loading')
      .d-flex.justify-content-center(v-for='item in 12' :key='item')
        CustomSkeletonVue(:width='220', :height='370')
    .grid-container(v-else)
      .d-flex.justify-content-center(v-for='(item, index) in (currentTab === "your" ? assetsData : recipientData)' :key='index')
        NormalCard(
          :data='item',
          mode='assetsInventory',
          :addTrade="addTrade",
          :cardState="currentTab === 'your' ? (myTrade.find(data => data.asset_id === item.asset_id) ? 'disable' : 'enable') : (theirTrade.find(data => data.asset_id === item.asset_id) ? 'disable' : 'enable')"
        )
</template>

<script>
import { mapState } from 'vuex'
import TradeofferTab from '~/components/nft_markets/TradeofferTab'
import CustomSkeletonVue from '~/components/CustomSkeleton'
import NormalCard from '~/components/nft_markets/NormalCard'
import searchImg from '~/assets/images/search.svg'
import filterImg from '~/assets/images/filter.svg'
import downImg from '~/assets/images/down.svg'
import defaultImg from '~/assets/images/default.png'

export default {
  components: {
    TradeofferTab,
    NormalCard,
    CustomSkeletonVue
  },
  data() {
    return {
      search: '',
      sellOrders: [],
      tabIndex: 0,
      currentTab: 'your',
      memo: '',
      userName: '',
      myTrade: [],
      theirTrade: [],
      recipientName: '',
      assetsData: [],
      recipientData: [],
      collectionData: [],
      collectionName: '',
      loading: true,
      data: {
        searchIcon: searchImg,
        filterIcon: filterImg,
        downIcon: downImg
      },
      defaultBackground: {
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundImage: 'url(' + defaultImg + ')'
      }
    }
  },
  computed: {
    ...mapState(['network', 'user']),
    userData() {
      return this.user
    }
  },
  watch: {
    userData(new_data, old_data) {
      if (!old_data && new_data) {
        this.userName = new_data.name
        this.getAssetsInventory(new_data.name)
      }
    },
    recipientName(new_name, old_name) {
      if (new_name && this.currentTab === 'their') {
        this.theirTrade = []
        this.getAssetsInventory(new_name)
      }
    },
    currentTab(new_tab, old_tab) {
      if (new_tab === 'their' && this.recipientName) {
        this.getAssetsInventory(this.recipientName)
      }
    }
  },
  mounted() {
    if (this.user) {
      this.userName = this.user.name
      this.getAssetsInventory(this.user.name)
    }
    this.getCollectionData()
  },
  methods: {
    debounceSearch(event) {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(() => {
        this.recipientName = event.target.value
      }, 600)
    },
    deleteMyTradeItem(id) {
      this.myTrade = this.myTrade.filter((item) => item.asset_id !== id)
    },
    deleteTheirTradeItem(id) {
      this.theirTrade = this.theirTrade.filter((item) => item.asset_id !== id)
    },
    handleTab(value) {
      this.currentTab = value
    },
    async getCollectionData() {
      this.collectionData = await this.$store.dispatch('api/getCollectionData', {
        author: ''
      })
    },
    async handleSearch(key) {
      this.loading = true
      if (this.currentTab === 'your' && this.user.name) {
        this.assetsData = await this.$store.dispatch('api/getAssetsInventory', {
          owner: this.user.name,
          search: key
        })
      } else if (this.currentTab === 'their' && this.recipientName) {
        this.recipientData = await this.$store.dispatch('api/getAssetsInventory', {
          owner: this.recipientName,
          search: key
        })
      }
      this.loading = false
    },
    handleCollection(value) {
      this.collectionName = value
      if (this.currentTab === 'your' && this.user.name) {
        this.getAssetsInventory(this.user.name)
      } else if (this.currentTab === 'their' && this.recipientName) {
        this.getAssetsInventory(this.recipientName)
      }
    },
    addTrade(item) {
      if (this.currentTab === 'your') {
        if (!this.myTrade.find((data) => data.asset_id === item.asset_id)) {
          this.myTrade.push(item)
        }
      } else if (
        !this.theirTrade.find((data) => data.asset_id === item.asset_id)
      ) {
        this.theirTrade.push(item)
      }
    },
    async getAssetsInventory(owner) {
      this.loading = true
      const data = await this.$store.dispatch('api/getAssetsInventory', {
        owner,
        collection: this.collectionName
      })
      if (this.currentTab === 'your') {
        this.assetsData = data
      } else {
        this.recipientData = data
      }
      this.loading = false
    },
    async sendTradeOffer() {
      const recipientAssetsIds = []
      const senderAssetsIds = []
      this.theirTrade.map((item) => {
        recipientAssetsIds.push(item.asset_id)
      })
      this.myTrade.map((item) => {
        senderAssetsIds.push(item.asset_id)
      })
      const actions = [
        {
          account: 'atomicassets',
          authorization: [this.user.authorization],
          data: {
            memo: this.memo,
            recipient: this.recipientName,
            sender: this.userName,
            recipient_asset_ids: recipientAssetsIds,
            sender_asset_ids: senderAssetsIds
          }
        }
      ]
      if (this.myTrade.length && this.theirTrade.length) {
        await this.$store.dispatch('api/transferOffer', {
          actions
        })
        this.$notify({ title: 'Send Trade Offer', message: 'Sent Trade!', type: 'success' })
      }
    }
  }
}
</script>

<style lang='scss'>
.tradeoffer {
  .normalcard {
    padding: 6px 10px;
  }

  .add-btn {
    padding: 91px 0 !important;

    a {
      color: #67c23a !important;
    }
  }

  .recipient_name {
    background-color: transparent;
    height: 30px;
    border: 0;
    border-bottom: 1px solid #333;
    color: #bec6cb;
  }

  .nft-container.j-container {
    max-width: none;
  }

  .add-btn-container {
    padding: 3px;
    color: green;
  }

  .create-section-item {
    .main-img {
      height: 200px;
      width: 100%;
    }

    height: 250px;
    padding: 5px;
    margin: auto;
    background-color: #202021;
    border-radius: 5px;
  }

  .section-item_name {
    color: #66c167;
    text-align: center;
    background-color: #202021;
    font-size: 18px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flfum-img {
    width: 42px;
    height: 42px;
  }

  .p-7 {
    padding: 7px;
  }

  .nft-create-section {
    background-color: black;
    border: 2px solid green;
    border-radius: 6px;
    min-height: 270px;
  }

  .flfum-title {
    padding: 7px;
    font-size: 20px;
  }

  .chart-items {
    font-size: 12px;

    p:first-child {
      margin-bottom: 10px;
    }
  }

  .color-yellow {
    color: #f89022;
  }

  .color-green {
    color: #66c167;
  }

  .color-red {
    color: #c76d59;
  }

  .trade-btn-group p {
    font-size: 14px;
    border-radius: 8px;
    padding: 16px 19px;
    background-color: #333;
    text-align: center;
    width: 136px;
    margin: 0;
    cursor: pointer;

    &.active-btn {
      background-color: #161617;
    }
  }

  #return-btn::before {
    content: '←';
  }

  #return-btn {
    font-size: 16px;
    font-weight: 700;
    color: #9f979a !important;
    cursor: pointer;
    padding-left: 10px;
  }

  h4 {
    margin: 32px 0;
  }

  div.grid-container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    gap: 30px;
  }

  .cross-btn {
    width: 20px;
    height: 20px;
    cursor: pointer;
    position: absolute;
    top: 8px;
    right: 4px;
    background-size: 100% auto;
    background-repeat: no-repeat;
    opacity: 0.8;
    text-shadow: 0 0 3px #ff0000, 0 0 5px #0000ff;
  }

  .cross-btn:hover {
    opacity: 1;
  }

  .add-btn-container {
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    color: #67c23a;
  }
}
</style>
