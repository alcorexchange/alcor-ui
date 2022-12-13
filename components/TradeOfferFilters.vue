<template lang="pug">
el-dropdown#alcor-filters-component.d-flex.justify-content-between.align-items-center.pointer(
  placement="bottom-start"
  trigger='click'
  :hideOnClick="false"
  :class="{ active }"
  @visible-change="isActive => this.active = isActive"
)
  .d-flex.align-items-center.gap-8.fs-16.button
    i.el-icon-set-up
    span Filter
    i.el-icon-caret-bottom

  el-dropdown-menu.dropdown
    el-dropdown-item.dropdown__filters
      .d-flex.justify-content-between.gap-16
        .w-50.d-flex.flex-column.gap-8
          .d-flex.gap-8.align-items-center(v-for="[ key, value ] in Object.entries(filters)")
            el-select.fs-12.w-100(
              v-if="key === 'show_invalid_offers' && typeOptions"
              v-model="filters[key]"
              :placeholder='$t("Choose order type")'
              size="mini"
            )
              el-option(
                v-for='{ value, label } in typeOptions'
                :key='value'
                :label='label'
                :value='value'
              )

            el-switch(
              v-else
              v-model="filters[key]"
              id="filter"
            )
            span.fs-12.lh-12 {{ labels[key] }}
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
      { label: 'All Offers', value: '0,1' },
      { label: 'Only valid Offers', value: '0' },
      { label: 'Only invalid Offers', value: '1' }
    ],
    sortingOptions: [
      { label: 'Newest to Oldest', value: 'desc' },
      { label: 'Oldest to Newest', value: 'asc' }
    ],
    active: false,
    labels: {
      show_only_friends_offers: 'Only Friends Offers',
      hide_empty_offers: 'Hide Empty Offers',
      hide_contracts: 'Show DAPP Trades'
    }
  }),
  methods: {
    reset() {
      this.$emit(
        'update:filters',
        Object.entries(this.filters)
          .map(([key, value]) => key === 'show_invalid_offers' ? [key, 0] : [key, false])
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
      )
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
