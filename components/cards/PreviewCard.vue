<template lang="pug">
card.normal-card-shadow(:class="[{ small }]" @click="$emit('click')")
  .d-flex.justify-content-end(slot="header")
    .card_number.d-flex.align-items-center.ml-1.fs-12.color-green {{ "#" + mint }}

  asset-card-image.main-img(:template="{ ...data.immutable_data, ...data.template.immutable_data }")

  .d-flex.flex-column.justify-content-between.align-items-center.p-2.card-title(slot="footer")
    .card-name {{ data.name }}
    .disable.d-flex.gap-4
      .card-collection {{ data.collection.name }}
      img.success-icon.ml-1(src='~/assets/images/check_circle.svg', alt='')

  .w-100(slot="footer")
    slot(name="footer")
</template>

<script>
import Card from '~/components/cards/Card.vue'
import AssetCardImage from '~/components/cards/components/AssetCardImage.vue'

export default {
  components: { Card, AssetCardImage },
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
