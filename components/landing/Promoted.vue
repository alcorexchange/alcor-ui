<template lang="pug">
.promoted-markets(v-if="promos.length")
  SectionTitle.section-title {{ $t('Promotions') }}

  el-carousel(indicator-position="outside" arrow="never" :interval="7000")
    //el-carousel-item(v-for="promo in promos")
      promo(:promo="promo" :bannerUrl="promo.bannerUrl")

    el-carousel-item
      promo(:promo="promos[0]" :bannerUrl="promos[0].bannerUrl")

    el-carousel-item
      promo(:promo="promos[1]" :bannerUrl="promos[1].bannerUrl")

  spacer
</template>

<script>
import { mapGetters } from 'vuex'
import Spacer from '@/components/Spacer.vue'
import Promo from '@/components/landing/Promo'
import SectionTitle from '@/components/landing/SectionTitle'
import { shuffleArray } from '~/utils'

export default {
  components: { Spacer, Promo, SectionTitle },
  data: () => ({
    bannerOnly: [
      {
        bannerImg: 'zombiecointk',
        bannerUrl: 'https://www.zombiecoin.io'
      },

      {
        bannerImg: 'pinup24heels',
        bannerUrl: 'https://alcor.exchange/trade/heels-pinup24heels_wax-eosio.token'
      },
    ],

    promos: []
  }),

  mounted() {
    this.promos = this.bannerOnly.sort(() => Math.random() - 0.5)
  },

  computed: {
    // ...mapGetters({
    //   promoted: 'promoted'
    // }),

    // TODO Make this shit work
    // promos() {
    //   const promotedList = [...this.bannerOnly]

    //   const shuffled = promotedList
    //   return shuffled
    //   // console.log('promoted', [...this.promoted, ...this.bannerOnly].sort(() => Math.random() - 0.5))
    //   // const promotedList = [...this.promoted, ...this.bannerOnly]
    //   // console.log('before shuffle', promotedList)
    //   // shuffleArray(promotedList)
    //   // console.log('after shuffle', promotedList)
    //   // return this.bannerOnly
    // }
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
