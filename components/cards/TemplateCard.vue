<template lang="pug">
card
  asset-card-image.main-img(:template="data.immutable_data")

  .p-2
    .d-flex.justify-content-between.align-items-center
      .disable.d-flex.gap-4.fs-12
        .card-collection {{ data.collection.name }}
        img.success-icon.ml-1(src='~/assets/images/check_circle.svg', alt='')
      .disable.fs-12 Assets
    .d-flex.justify-content-between.align-items-center
      .color-action.fs-14.w-50.text-truncate {{ data.name }}
      .fs-14 {{ data.issued_supply }}
    .d-flex.justify-content-between.align-items-center
      .color-action.fs-12 {{ '#' + data.template_id }}

  .w-100(slot="footer")
    alcor-button.w-100(outline) {{ $t('Details') }}
    slot(name="footer")
</template>

<script>
import Card from '~/components/cards/Card.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: { Card, AssetCardImage, AlcorButton },
  props: ['data', 'small'],
  computed: {
    mint() {
      return this.data.template_mint.length > 4 ? this.data.template_mint.substr(0, 1) + '...' + this.data.template_mint.substr(-3) : this.data.template_mint
    }
  }
}
</script>

<style scoped lang="scss">
.card_number {
  padding: 0 3px;
  border-radius: 3px;
  height: 22px;
  background-color: var(--card-number);
}

.card-name {
  font-size: 18px;
}

.card-name,
.card-collection {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-align: center;
  text-overflow: ellipsis;
}

.small {
  width: 170px;

  .main-img {
    height: 140px;
  }

  .card-name {
    font-size: 14px;
  }
}
</style>
