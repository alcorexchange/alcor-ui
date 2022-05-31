<template lang="pug">
.d-flex.justify-content-between.tabar-container.tradeoffertab.row.mb-4
  .col-4.d-flex.justify-content-between.align-items-end
    .search-input-group.border-bottom--gray
      img.search-icon(:src='data.searchIcon' alt='')
      input.search-input.pb-1(type='text' @input='debounceSearch' @focus='focusInput' @blur='blurInput' placeholder='Search name or address')
    el-dropdown.filter-input-group.border-bottom--gray.d-flex.flex-column.justify-content-center.pb-1(
      trigger='click'
    )
      .el-dropdown-link.d-flex.align-items-center.justify-content-between
        img.me-1(:src='data.filterIcon', alt='')
        p.m-0 Filter
        i.el-icon-arrow-down.el-icon--right
      el-dropdown-menu.collection-dropdown(slot='dropdown')
        button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
          @click='() => handleCollection("")'
        )
          img(src='~/assets/images/default.png')
          p.ml-1.flex-fill.text-left.collection-name.mb-0 All
        button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
          v-for='(item, index) in collectionData',
          :key='index',
          @click='() => handleCollection(item.collection_name)'
        )
          img(v-if='item.img && item.img.includes("https://")', :src='item.img')
          img(v-else-if='item.img', :src='"https://ipfs.io/ipfs/" + item.img')
          img(v-else, src='~/assets/images/default.png')
          p.ml-1.flex-fill.text-left.collection-name.mb-0 {{ item.name }}
  .col-6.d-flex.justify-content-between
    .tab-btn.border-bottom--green(v-if="currentTab === 'your'") Your Inventory
    .tab-btn.border-bottom--gray(v-else='' @click="handleTab('your')") Your Inventory
    .tab-btn.border-bottom--green(v-if="currentTab === 'their'") Their Inventory
    .tab-btn.border-bottom--gray(v-else='' @click="handleTab('their')") Their Inventory
    button.btn.create-collection-btn(@click="sendTradeOffer")
      img(src='~/assets/images/handshake.svg')
      |Send Trade Offer
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: [
    'data',
    'currentTab',
    'handleTab',
    'handleSearch',
    'collectionData',
    'handleCollection',
    'sendTradeOffer'
  ],
  data() {
    return {
      sellOrders: [],
    }
  },
  methods: {
    debounceSearch(event) {
      clearTimeout(this.debounce)
      this.debounce = setTimeout(() => {
        this.handleSearch(event.target.value)
      }, 600)
    },
    focusInput(event) {
      event.target.parentElement.classList.add('border-bottom--cancel')
    },
    blurInput(event) {
      event.target.parentElement.classList.remove('border-bottom--cancel')
    },
  },
}
</script>

<style scoped lang="scss">
.tradeoffertab {
  .create-collection-btn {
    float: right;
    text-align: center;
    padding: 19px 3px;
    width: 220px;
    padding: 13px;
    color: #000;
    font-size: 14px;
    font-weight: 700;
    background: #67c23a;
    border-radius: 8px;
    cursor: pointer;
  }
  .tabar-container {
    margin-bottom: 35px;
  }
  .tab-btn {
    color: #bec6cb;
  }
  .border-bottom--gray {
    border-bottom: 1px solid #333;
    width: 225px;
  }
  .border-bottom--green {
    border-bottom: 1px solid #67c23a;
    width: 225px;
  }
  .border-bottom--cancel {
    border-bottom: 1px solid var(--cancel);
  }
  .search-input-group,
  .filter-input-group {
    position: relative;
  }
  .filter-input-group {
    width: 100px;
  }
  .filter-input,
  .search-input {
    color: var(--cancel);
  }
  .filter-input-group .search-input {
    width: 90px !important;
  }
  .tab-btn {
    cursor: pointer;
    margin: 0 -22px;
    padding: 12px 0;
    font-size: 15px;
    text-align: center;
    width: 130px;
  }
  .search-icon,
  .filter-icon,
  .down-icon {
    position: absolute;
    top: 0;
    transform: translate(25%, 50%);
    width: 15px;
    height: 15px;
  }
  .search-icon {
    left: 0;
  }
  .down-icon {
    right: 0;
    transform: translate(-25%, 50%);
  }
  .search-input {
    padding: 5px 25px;
    outline: none;
    border: none;
    background-color: transparent;
  }
}
</style>

<style lang="scss">
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
      object-fit: cover;
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
.wallet-nft-tab {
  .filter-input-group {
    .dropdown-toggle {
      height: 37px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 0;
      padding: 5px;
      border: 0;
      box-shadow: none !important;
      outline: none !important;
      color: var(--color-text-primary);
      background: transparent !important;
    }
  }
}
</style>
