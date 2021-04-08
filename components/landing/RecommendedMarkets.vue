<template lang="pug">
.recommented-markets
    SectionTitle.section-title Recommended Markets
    .items
        .item-container(:key="market.id" v-for="market in markets")
            nuxt-link.item(:to="{ name: 'trade-index-id', params: { id: market.slug } }")
                .top
                    TokenImage(:src="$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)" height="25")
                    span.ml-2 {{ market.symbol }}

                .bottom
                    span {{ market.last_price }}
                    ChangePercent(:change="market.changeWeek")

        .item-container
            .col-lg-2.col-md-4.col-sm-6
                el-button(@click="openInNewTab('https://t.me/avral')" type="text" icon="el-icon-circle-plus-outline") Token promotion
    Spacer
</template>

<script>
import Spacer from '@/components/Spacer'
import SectionTitle from '@/components/landing/SectionTitle'
import TokenImage from '~/components/elements/TokenImage'
import ChangePercent from '~/components/trade/ChangePercent'

export default {
  components: {
    TokenImage,
    ChangePercent,
    SectionTitle,
    Spacer
  },

  //   props: {
  //     markets: {
  //       type: Array,
  //       default: () => []
  //     }
  //   },

  computed: {
    markets() {
      try {
        return this.$store.state.markets.filter((m) => {
          return this.$store.state.network.RECOMMENDED_MARKETS.includes(
            m.quote_token.str
          )
          // || this.$store.state.network.RECOMMENDED_MARKETS.includes(m.base_token.str)
        })
      } catch (e) {
        console.log(e, 'Error getting markets in recomendations!!!')
        return []
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.items {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.item-container {
  padding: 0;
  width: 20%;
  min-width: 240px;
}
.item {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid var(--dark-btn-sm);
  //   background: var(--bg-big-card);
  color: var(--text-default) !important;
  transition: all 0.3s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow);
  }
}
.top {
  margin-bottom: 12px;
}
.bottom {
  display: flex;
  justify-content: space-between;
}
@media only screen and (max-width: 1040px) {
  .items {
    justify-content: flex-start;
  }
  .item-container {
    padding: 14px;
  }
}
@media only screen and (max-width: 760px) {
  .items {
    justify-content: center;
  }
}
@media only screen and (max-width: 540px) {
  .item-container {
    width: 100%;
    padding: 8px;
  }
  //   .item{
  //       border: ;
  //   }
}
</style>
