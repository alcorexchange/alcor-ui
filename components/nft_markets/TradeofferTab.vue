<template lang="pug">
.d-flex.justify-content-between.tabar-container.tradeoffertab.row.mb-4
  .col-4.d-flex.justify-content-between
    .search-input-group.border-bottom--gray
      img.search-icon(:src='data.searchIcon' alt='')
      input.search-input(type='text' @input='debounceSearch' @focus='focusInput' @blur='blurInput' placeholder='Search name or address')
      img.down-icon(:src='data.downIcon' alt='')
    .filter-input-group.border-bottom--gray
      img.filter-icon(:src='data.filterIcon' alt='')
      input.search-input(type='text' @focus='focusInput' @blur='blurInput' placeholder='Filter')
      img.down-icon(:src='data.downIcon' alt='')
  .col-6.d-flex.justify-content-between
    .tab-btn.border-bottom--green(v-if="currentTab === 'your'") Your Inventory
    .tab-btn.border-bottom--gray(v-else='' @click="handleTab('your')") Your Inventory
    .tab-btn.border-bottom--green(v-if="currentTab === 'their'") Their Inventory
    .tab-btn.border-bottom--gray(v-else='' @click="handleTab('their')") Their Inventory
    .create-collection-btn
      img(src='~/assets/images/handshake.svg')
      |Send Trade Offer
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
    background: #67C23A;
    border-radius: 8px;
    cursor: pointer;
  }
  .tabar-container {
    margin-bottom: 35px;
  }
  .tab-btn {
    color: #BEC6CB;
  }
  .border-bottom--gray {
    border-bottom: 1px solid #333;
    width: 225px;
  }
  .border-bottom--green {
    border-bottom: 1px solid #67C23A;
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
    width:130px;
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

<script>
import { mapState } from 'vuex'

export default {
  props: [
    'data',
    'currentTab',
    'handleTab'
  ],
  data() {
    return {
      search: null,
      sellOrders: [],
    }
  },
  methods: {
    debounceSearch(event) {
      this.search = null
      clearTimeout(this.debounce)
      this.debounce = setTimeout(() => {
        this.search = event.target.value
        // search function
      }, 600)
    },
    focusInput(event) {
      event.target.parentElement.classList.add('border-bottom--cancel')
    },
    blurInput(event) {
      event.target.parentElement.classList.remove('border-bottom--cancel')
    }
  }
}
</script>
