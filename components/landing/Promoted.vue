<template lang="pug">
.promoted-markets
  SectionTitle.section-title Promotions

  el-carousel(indicator-position="outside" arrow="never" interval="5000")
    el-carousel-item(v-for="promo in promoted" :key="promo")
      promo(:promo="promo")

  spacer
</template>

<script>
import { mapGetters } from 'vuex'
import Spacer from '@/components/Spacer.vue'
import Promo from '@/components/landing/Promo'
import SectionTitle from '@/components/landing/SectionTitle'

export default {
  components: { Spacer, Promo, SectionTitle },
  computed: {
    ...mapGetters({
      promoted: 'promoted'
    })
  }
}
</script>

<style>
.el-carousel__container {
  height: 273px !important;
}

.el-carousel__indicator,
.el-carousel__indicator>.el-carousel__button {
  width: 112px;
  height: 4px;
  margin: 0 12px;
  border-radius: 6px;
}

.section-title {
  margin-bottom: 48px !important;
}
</style>
