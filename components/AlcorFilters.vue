<template lang="pug">
el-dropdown#alcor-filters-component.d-flex.justify-content-between.align-items-center.pointer(
  trigger='click'
  :hideOnClick="false"
)
  .d-flex.align-items-center.gap-8.disable.button
    i.el-icon-set-up.fs-14
    span Filter
    i.el-icon-caret-bottom.fs-14
  el-dropdown-menu.dropdown
    el-dropdown-item.dropdown__filters
      .d-flex.justify-content-between.gap-16
        .w-50
          el-select.fs-12.w-100(
            v-if="options.collection"
            v-model='filters.collection'
            :placeholder='$t("Choose Collection") + " (" + options.collection.length + ")"'
            size="mini"
          )
            el-option(
              v-for='{ collection, assets } in options.collection'
              :key='collection.collection_name'
              :label='collection.name + " (" + assets + ")"'
              :value='collection.collection_name'
            )
              .d-flex.gap-10.align-items-center
                img.icon(:src="`https://resizer.atomichub.io/images/v1/preview?ipfs=${collection.img}&size=370`")
                span {{ collection.name }} ({{ assets }})

        .w-50
          el-select.fs-12.w-100(
            v-if="options.sorting"
            v-model='filters.sorting'
            :placeholder='$t("Choose a sorting order")'
            size="mini"
          )
            el-option(
              v-for='{ value, label } in options.sorting'
              :key='value'
              :label='label'
              :value='value'
            )
      .d-flex.justify-content-between.gap-16.mt-2
        .w-50
          .d-flex.gap-6
            el-input.dark(
              size='small',
              v-model='filters.minMint',
              :placeholder='$t("Min Mint")',
            )
            el-input.dark(
              size='small',
              v-model='filters.maxMint',
              :placeholder='$t("Max Mint")',
            )
        .w-50
          el-checkbox(
            v-model="filters.isDuplicates"
          ) {{ $t('Only Duplicates') }}
          el-checkbox(
            v-model="filters.isBacked"
          ) {{ $t('Only backed NFTs') }}


      //.d-flex.justify-content-between.gap-16.mt-2
        span
        alcor-button.apply-btn.w-33(outline compact @click="applyFilters") Apply

</template>

<script>
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { AlcorButton },
  props: ['filters', 'options'],
  methods: {
    applyFilters() {
      this.$router.push({ query: this.filters })
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

  .button {
    padding: 8px;
    border-bottom: 1px solid var(--tab-link-border);
  }
}

.dropdown__filters {
  width: 460px;
}

.apply-btn .inner {
  line-height: initial;

}
</style>
