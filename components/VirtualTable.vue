<template lang="pug">
recycle-scroller(
  :emit-update="true"
  @update="(...args) => $emit('update', (args))"
  class="scroller wrapper"
  :class="{ window: !table.pageMode }"
  :items="sortedData"
  :item-size="table.itemSize"
  :pageMode="table.pageMode"
  :buffer="buffer || 450"
  list-tag="div"
)
  template(#before)
    div.header(:class="{ 'mobile': isMobile }")
      div.header__column(v-for="head in table.header" v-if="!isMobile || !head.desktopOnly" :key="head.value" :style="{ width: head.width, '--mobile-width': head.mobileWidth || '33%' }" )
        span(:class="{ pointer: head.sortable }" @click="() => head.sortable ? sort({ key: head.value, route: 0 }) : null")
          slot(:name="`${head.slot}-header`") {{ $t(head.label) }}
        sorter(v-if="head.sortable" :sort-by="head.value" :active-sort="activeSort" @change="sort")
  template(v-slot="{ item }")
    slot(name="row" :item="item")

  template(#empty v-if="!sortedData || !sortedData.length")
    slot(name="empty")
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'
import Sorter from '~/components/Sorter'

export default {
  components: { Sorter, RecycleScroller },
  props: ['table', 'buffer', 'defaultSortKey'],
  data: () => ({ sortKey: null, route: 1 }),

  computed: {
    sortedData() {
      if (!this.sortKey) return this.table.data
      const data = [...this.table.data]
      data.sort((a, b) => (a[this.sortKey] > b[this.sortKey] ? -1 : 1))
      return this.route ? data.reverse() : data
    },
    activeSort() {
      return { key: this.sortKey, route: this.route }
    },
  },
  mounted() {
    if (this.defaultSortKey) this.sort({ key: this.defaultSortKey, route: 0 })
  },
  methods: {
    sort(updated) {
      console.log('updated', updated.key)
      if (this.sortKey == updated.key && this.route == updated.route) {
        this.sortKey = null
        this.route = null
        return
      }
      this.sortKey = updated.key
      this.route = updated.route
    },
  },
}
</script>

<style>
.scroller .vue-recycle-scroller__item-view.hover {
  background: var(--hover);
}
</style>

<style scoped>
.wrapper {
  background: var(--background-color-third);
  border-radius: 8px;
  width: 100%;
}

.scroller {
  border-top: none;
  color: var(--text-secondary);
}

.scroller.window {
  height: 450px;
}

.mobile-trade-inner .scroller.window {
  height: 274px;
}

.scroller::-webkit-scrollbar {
  display: none;
}

.header {
  position: static;
  width: 100%;
  z-index: 10;
  text-align: right;
  display: flex;
  line-height: 20px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--background-color-base);
}

.header__column {
  display: flex;
  gap: 5px;
  align-items: center;
  font-weight: 500;
  justify-content: flex-end;
  text-overflow: ellipsis;
}

.header__column > span {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.header.mobile {
  padding: 10px 10px;
}

.header.mobile .header__column {
  width: var(--mobile-width) !important;
  font-size: 11px;
}

.header__column:first-of-type {
  justify-content: flex-start;
}

.user {
  height: 32%;
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.no-data {
  width: 100%;
  color: #909399;
  font-size: 14px;
  padding: 15px;
  display: flex;
  justify-content: center;
}
</style>
