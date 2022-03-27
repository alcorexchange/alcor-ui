<template lang="pug">
.d-flex.justify-content-between.tabar-container
  .search-input-group.border-bottom--gray
    img.search-icon(:src='data.searchIcon' alt='')
    input.search-input(type='text' @input='debounceSearch' @focus='focusInput' @blur='blurInput' placeholder='Search name or address')
    img.down-icon(:src='data.downIcon' alt='')
  .filter-input-group.border-bottom--gray
    img.filter-icon(:src='data.filterIcon' alt='')
    input.search-input(type='text' @focus='focusInput' @blur='blurInput' placeholder='Filter')
    img.down-icon(:src='data.downIcon' alt='')
  .tab-btn.border-bottom--green(v-if="currentTab === 'sales'") Sales
  .tab-btn.border-bottom--gray(v-else='' @click="handleTab('sales')") Sales
  .tab-btn.border-bottom--green(v-if="currentTab === 'auctions'") Auctions
  .tab-btn.border-bottom--gray(v-else='' @click="handleTab('auctions')") Auctions
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
  width: 100px;
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
