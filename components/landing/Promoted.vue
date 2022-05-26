<template lang="pug">
.promoted-markets
  | promo

  el-carousel(indicator-position="outside" arrow="never" interval="5000")
    el-carousel-item(v-for="promo in promoted" :key="promo")
      promo(:promo="promo")

  spacer
</template>

<script>
import { mapGetters } from 'vuex'
import Spacer from '@/components/Spacer.vue'
import Promo from '@/components/landing/Promo'

export default {
  components: { Spacer, Promo },
  computed: {
    ...mapGetters({
      promoted: 'promoted'
    })
  }
}
</script>

<style>
.el-carousel__indicator,
.el-carousel__indicator>.el-carousel__button {
  width: 112px;
  height: 4px;
  margin: 0 12px;
  border-radius: 6px;
}
</style>
