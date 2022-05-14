<template lang="pug">
.d-flex.justify-content-between.tabar-container.tradeoffertab.row.mb-4.wallet-nft-tab
  label.search-input-group.border-bottom--gray.d-flex.align-items-center
    img.search-icon(src='~/assets/images/search.svg', alt='')
    input.search-input.w-100(
      type='text',
      :value='searchValue',
      @input='debounceSearch',
      @focus='focusInput',
      @blur='blurInput',
      placeholder='Search name or address'
    )
    img.down-icon(src='~/assets/images/down.svg', alt='')
  el-dropdown.filter-input-group.border-bottom--gray.d-flex.flex-column.justify-content-center(
    trigger='click'
  )
    .el-dropdown-link.d-flex.align-items-center.justify-content-between
      img.me-1(src='~/assets/images/filter.svg', alt='')
      p.m-0 Filter
      i.el-icon-arrow-down.el-icon--right
    el-dropdown-menu.collection-dropdown(slot='dropdown')
      button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
        @click='() => handleCollection("")'
      )
        img(src='~/assets/images/default.png')
        p.ml-1.flex-fill.text-left.collection-name All
      button.btn.btn-collection.w-100.mb-1.d-flex.align-items-center(
        v-for='(item, index) in collectionData',
        :key='index',
        @click='() => handleCollection(item.collection_name)'
      )
        img(v-if='item.img && item.img.includes("https://")', :src='item.img')
        img(v-else-if='item.img', :src='"https://ipfs.io/ipfs/" + item.img')
        img(v-else, src='~/assets/images/default.png')
        p.ml-1.flex-fill.text-left.collection-name {{ item.name }}
  nuxt-link.tab-btn.border-bottom--green(
    :to='"#" + tab.slug',
    v-for='(tab, index) in tabData',
    :key='index',
    v-if='currentTab === tab.slug'
  ) {{ tab.title }}
  nuxt-link.tab-btn.border-bottom--gray.text-white(
    :to='"#" + tab.slug',
    v-else='',
    @click='handleTab(tab.slug)'
  ) {{ tab.title }}
</template>

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
  .down-icon,
  .filter-icon,
  .search-icon {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }
  .tab-btn {
    color: #bec6cb;
  }
  .border-bottom--gray {
    border-bottom: 1px solid #333;
  }
  .border-bottom--green {
    border-bottom: 1px solid #67c23a;
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
  }

  .filter-input-group .search-input {
    width: 80px !important;
  }
  .filter-input,
  .search-input {
    color: var(--cancel);
  }
  .tab-btn {
    cursor: pointer;
    padding: 12px 0;
    font-size: 15px;
    text-align: center;
    width: 130px;
  }
  .search-icon {
    left: 0;
  }
  .down-icon {
    left: auto;
    right: 10px;
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
<script>
export default {
  props: [
    'tabData',
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
