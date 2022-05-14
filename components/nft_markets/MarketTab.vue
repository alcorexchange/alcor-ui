<template lang="pug">
.d-flex.justify-content-between.tabar-container
  .search-input-group.border-bottom--gray
    img.search-icon(:src='data.searchIcon', alt='')
    input.search-input(
      type='text',
      :value='searchValue',
      @input='debounceSearch',
      @focus='focusInput',
      @blur='blurInput',
      placeholder='Search name or address'
    )
    img.down-icon(:src='data.downIcon', alt='')
  el-dropdown.filter-input-group.border-bottom--gray.d-flex.flex-column.justify-content-center(
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
  .tab-btn.border-bottom--green(v-if='currentTab === "sales"') Sales
  .tab-btn.border-bottom--gray(v-else='', @click='handleTab("sales")') Sales
  .tab-btn.border-bottom--green(v-if='currentTab === "auctions"') Auctions
  .tab-btn.border-bottom--gray(v-else='', @click='handleTab("auctions")') Auctions
</template>

<style scoped lang="scss">
.tabar-container {
  margin-bottom: 35px;
}
.border-bottom--gray {
  border-bottom: 1px solid #333;
  width: 225px;
}
.border-bottom--green {
  border-bottom: 1px solid var(--main-green);
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
  width: 87px;
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
.filter-input,
.search-input {
  color: var(--cancel);
}
.filter-input-group .search-input {
  width: 80px !important;
}
.tab-btn {
  cursor: pointer;
  padding: 5px;
  font-size: 18px;
  text-align: center;
  width: 293px;
}
.search-icon,
.filter-icon,
.down-icon {
  position: absolute;
  top: 50%;
  transform: translate(25%, -50%);
  width: 15px;
  height: 15px;
}
.search-icon {
  left: 0;
}
.down-icon {
  right: 0;
  top: 50%;
  transform: translate(-25%, -50%);
}
.search-input {
  padding: 5px 25px;
  outline: none;
  border: none;
  background-color: transparent;
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
    'searchValue',
    'handleSearchValue',
  ],
  data() {
    return {
      search: null,
      sellOrders: [],
    }
  },
  watch: {
    search(newSearch, oldSearch) {
      console.log(newSearch)
    },
  },
  methods: {
    debounceSearch(event) {
      this.handleSearchValue(event.target.value)
      clearTimeout(this.debounce)
      this.debounce = setTimeout(() => {
        this.handleSearch(event.target.value)
        // search function
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
