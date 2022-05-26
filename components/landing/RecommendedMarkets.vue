<template lang="pug">
.recommented-markets
  .items
    .item-container(:key="market.id" v-for="market in markets")
      nuxt-link.item(:to="{ name: 'trade-index-id', params: { id: market.slug } }")
        .top
          TokenImage(:src="$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)" height="20")
          span.ml-2 {{ market.symbol }}

        .bottom
          span {{ market.last_price }}
          ChangePercent(:change="market.changeWeek")

  el-button(@click="openInNewTab('https://t.me/avral')" type="text" icon="el-icon-circle-plus-outline").token-promotion Token promotion
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
.token-promotion {
  border: 1px solid var(--dark-btn-sm);
  padding: 11px 16px;
  margin-top: 16px;

  &:hover {
    background-color: rgba(21, 21, 21, .3);
    border: 1px solid var(--dark-btn-sm);
  }

}

.section-title {
  margin-bottom: 25px !important;
}

.items {
  display: flex;
  gap: 34px;
  flex-wrap: wrap;
}

.item-container {
  padding-left: 0;
}

.item {
  width: 254px;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-radius: 4px;
  height: 64px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid var(--dark-btn-sm);
  //   background: var(--bg-big-card);
  color: var(--text-default) !important;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(21, 21, 21, .3);
  }
}

.top {
  margin-bottom: 6px;
  font-size: 12px;
}

.bottom {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

@media only screen and (max-width: 940px) {
  .item-container {
    height: 64px;
  }
}

@media only screen and (max-width: 600px) {
  .item-container {
    width: 50%;
    padding-left: 8px;
  }
}

@media only screen and (max-width: 440px) {
  .item-container {
    width: 100%;
    padding: 8px;
  }

  //   .item{
  //       border: ;
  //   }
}
</style>
