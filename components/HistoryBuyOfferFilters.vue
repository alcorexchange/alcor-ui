<template lang="pug">
el-dropdown#alcor-filters-component.d-flex.justify-content-between.align-items-center(
  placement="bottom-start"
  trigger='click'
  :hideOnClick="false"
  :class="{ active }"
  @visible-change="isActive => this.active = isActive"
)
  .d-flex.align-items-center.gap-8.fs-16.button.pointer
    i.el-icon-set-up
    span Filter
    i.el-icon-caret-bottom

  el-dropdown-menu.dropdown
    el-dropdown-item.dropdown__filters
      .d-flex.justify-content-between.gap-16
        .w-50.d-flex.flex-column.gap-8
            .d-flex.gap-8.align-items-center
              el-switch(
                v-model="filters['show_only_friends_offers']"
                id="filter"
              )
              span.fs-12.lh-12 {{ labels['show_only_friends_offers'] }}

            el-select.fs-12.w-100(
              v-if="typeOptions"
              v-model="filters['type']"
              :placeholder='$t("Choose order type")'
              size="mini"
            )
              el-option(
                v-for='{ value, label } in typeOptions'
                :key='value'
                :label='label'
                :value='value'
              )

            el-select.fs-12.w-100(
              v-if="statusOptions"
              v-model="filters['status']"
              :placeholder='$t("Choose order status")'
              size="mini"
            )
              el-option(
                v-for='{ value, label } in statusOptions'
                :key='value'
                :label='label'
                :value='value'
              )
            el-date-picker.w-100(
              v-model="filters.after"
              type="date"
              placeholder="Start date"
              size="mini"
            )
            el-date-picker.w-100(
              v-model="filters.before"
              type="date"
              placeholder="End date"
              size="mini"
            )

            el-input(size="small" v-model="filters['min_price']" placeholder="Min Price: 0")
            el-input(size="small" v-model="filters['max_price']" placeholder="Max Price")

        .w-50.d-flex.flex-column.justify-content-between
          el-select.fs-12.w-100(
            v-if="sortingOptions"
            v-model='sorting.val'
            :placeholder='$t("Choose a sorting order")'
            size="mini"
          )
            el-option(
              v-for='{ value, label } in sortingOptions'
              :key='value'
              :label='label'
              :value='value'
            )
          .d-flex.gap-4.align-items-center.fs-14.pointer(@click="reset")
            i.el-icon-delete-solid
            .fs-12.lh-12 Reset Filters

</template>

<script>
export default {
  props: ['filters', 'sorting'],
  data: () => ({
    typeOptions: [
      { label: 'All Buy Offers', value: 'account' },
      { label: 'Only Received Offers', value: 'buyer' },
      { label: 'Only Sent Offers', value: 'seller' }
    ],
    statusOptions: [
      { label: 'All Statuses', value: '1,2,3' },
      { label: 'Only Declined', value: '1' },
      { label: 'Only Canceled', value: '2' },
      { label: 'Only Accepted', value: '3' }
    ],
    sortingOptions: [
      { label: 'Newest to Oldest', value: 'created_desc' },
      { label: 'Oldest to Newest', value: 'created_asc' },
      { label: 'Lowest Price to Highest', value: 'price_asc' },
      { label: 'Highest Price to Lowest ', value: 'price_desc' }
    ],
    active: false,
    labels: {
      show_only_friends_offers: 'Only Friends Offers'
    }
  }),
  methods: {
    reset() {
      this.$emit('update:filters', {
        show_only_friends_offers: false,
        show_invalid_offers: '0',
        min_price: 3,
        max_price: null
      })
    }
  }
}
</script>

<style lang="scss">
.apply-btn .inner {
  line-height: initial;
}

.el-input.dark .el-input__inner {
  background-color: var(--btn-active);
  border: 1px solid var(--btn-active);
}
</style>

<style lang="scss" scoped>
#alcor-filters-component {
  line-height: initial;

  & .disabled {
    color: var(--btn-default);
    cursor: not-allowed;
  }

  &.active .button {
    border-bottom: 1px solid var(--main-action-green);
  }

  .button {
    padding: 10px;
    border-bottom: 1px solid var(--tab-link-border);
  }
}

.dropdown__filters {
  width: 360px;
}

.apply-btn .inner {
  line-height: initial;
}
</style>
