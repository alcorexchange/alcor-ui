<template lang="pug">
.promoted-markets(v-if="promoted.length")
  SectionTitle.section-title {{ $t('Promotions') }}

  el-carousel(indicator-position="outside" arrow="never" :interval="7000")
    el-carousel-item(v-for="promo in promoted" :key="promo.id")
      promo(:promo="promo")
    el-carousel-item(key="novopangea")
      promo(
        bannerImg="novopangea"
        bannerUrl="https://novopangea.io/token?utm_source=Alcor&utm_medium=Banner&utm_campaign=PreLaunch"
      )

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
.el-carousel .el-carousel__container {
  height: 295px;
}

@media only screen and (max-width: 840px) {
  .el-carousel .el-carousel__container {
    height: 600px;
  }
}

.el-carousel__indicators {
  padding: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-carousel__indicator--horizontal {
  padding: 0px !important;
}

.el-carousel__indicator,
.el-carousel__indicator > .el-carousel__button {
  width: 112px;
  height: 4px;
  margin: 0 12px;
  border-radius: 6px;
}

.promoted-markets .section-title {
  margin-bottom: 48px;
}

.token-promotion {
  width: 157px;
}

@media only screen and (max-width: 1040px) {
  .el-carousel .el-carousel__container {
    height: 660px;
  }
}

@media only screen and (max-width: 840px) {
  .el-carousel .el-carousel__container {
    height: 565px;
  }
}

@media only screen and (max-width: 640px) {
  .el-carousel .el-carousel__container {
    height: 475px;
  }

  .el-carousel__indicator,
  .el-carousel__indicator > .el-carousel__button {
    width: 70px;
    margin: 0 8px;
  }
}

@media only screen and (max-width: 440px) {
  .el-carousel .el-carousel__container {
    height: 420px;
  }

  .promoted-markets .section-title {
    margin-bottom: 24px;
  }
}
</style>
