<template lang="pug">
el-dropdown#alcor-filters-component.d-flex.justify-content-between.align-items-center.pointer(
  trigger='click'
  :hideOnClick="false"
  :class="{ active }"
  @visible-change="isActive => this.active = isActive"
  :disabled="disabled"
)
  .d-flex.align-items-center.gap-8.fs-16.button(:class="{ disabled }")
    i.el-icon-set-up
    span {{ $t('Filter') }}
    i.el-icon-caret-bottom
  el-dropdown-menu.dropdown
    el-dropdown-item.dropdown__filters
      .d-flex.justify-content-center.justify-content-md-between.gap-8.flex-wrap
        .filter-col
          el-select.fs-12.w-100(
            filterable
            v-if="options.collection"
            v-model='filters.collection_name'
            :placeholder='$t("Choose Collection") + " (" + options.collection.length + ")"'
            size="mini"
            clearable
          )
            el-option(
              v-for='{ collection, assets } in options.collection'
              :key='collection.collection_name'
              :label='collection.name'
              :value='collection.collection_name'
            )
              .d-flex.gap-10.align-items-center
                img.icon(:src="`https://resizer.atomichub.io/images/v1/preview?ipfs=${collection.img}&size=370`")
                span
                  span {{ collection.name }}
                  span(v-if="assets") ({{ assets }})

        .filter-col
          el-select.fs-12.w-100(
            v-if="options.sorting"
            v-model='filters.order'
            :placeholder='$t("Choose a sorting order")'
            @input="onOrderInput"
            size="mini"
          )
            el-option(
              v-for='{ value, label } in options.sorting'
              :key='value'
              :label='$t(label)'
              :value='value'
            )
      .d-flex.justify-content-center.justify-content-md-between.gap-8.mt-2.flex-wrap
        .filter-col
          .d-flex.gap-6
            el-input.dark(
              size='small',
              v-model='filters.min_template_mint',
              :placeholder='$t("Min Mint")',
            )
            el-input.dark(
              size='small',
              v-model='filters.max_template_mint',
              :placeholder='$t("Max Mint")',
            )
          //- .d-flex.gap-6
          //-   el-input.dark(
          //-     size='small',
          //-     v-model='filters.minPrice',
          //-     :placeholder='$t("Min Price")',
          //-   )
          //-   el-input.dark(
          //-     size='small',
          //-     v-model='filters.maxPrice',
          //-     :placeholder='$t("Max Price")',
          //-   )

        .filter-col
          el-checkbox(
            v-model="filters.only_duplicate_templates"
          ) {{ $t('Only Duplicates') }}
          el-checkbox(
            v-model="filters.has_backed_tokens"
          ) {{ $t('Only backed NFTs') }}

      .d-flex.justify-content-between.gap-16.mt-2
        span
        alcor-button.apply-btn.w-33(outline compact @click="applyFilters") Apply

</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
  props: ['options', 'disabled'],
  data: () => ({
    active: false,
    filters: {
      // match: '', TODO: Add later
      sort: undefined,
      order: undefined,
      collection_name: undefined,
      min_template_mint: undefined,
      max_template_mint: undefined,
      // minPrice: undefined, TODO: add later
      // maxPrice: undefined, TODO: add later
      only_duplicate_templates: false,
      has_backed_tokens: false
    }
  }),
  mounted() {
    this.updateQueryToData()
  },
  methods: {
    onOrderInput(e) {
      console.log(e)
      const [sort, order] = e?.split('-') || [undefined, undefined]
      this.filters.sort = sort
      this.filters.order = order
      this.applyFilters()
    },
    updateQueryToData() {
      const query = this.$route.query
      this.filters = {
        ...query,
        only_duplicate_templates: !!query.only_duplicate_templates,
        has_backed_tokens: !!query.has_backed_tokens
      }
    },
    applyFilters() {
      this.$router.push({
        query: {
          ...this.filters,

          // values to be removed when they are untrue
          collection_name: this.filters.collection_name || undefined,
          only_duplicate_templates:
            this.filters.only_duplicate_templates || undefined,
          has_backed_tokens: this.filters.has_backed_tokens || undefined
        }
      })
    }
  }
}
</script>

<style lang="scss">
img.icon {
  width: 20px;
}
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

  &.active {
    border-bottom: 1px solid var(--main-action-green);
  }

  .button {
    padding: 10px;
    border-bottom: 1px solid var(--tab-link-border);
  }
}

.filter-col {
  width: 100%;
  max-width: 210px;
}
.dropdown__filters {
  width: 100%;
  max-width: 460px;
}

.apply-btn .inner {
  line-height: initial;
}
</style>
