<template lang="pug">
.items.mb-5
  .item-container(:key="market.id" v-for="market in markets")
    nuxt-link.item(:to="{ name: `trade-index-id___${$i18n.locale}`, params: { id: market.slug } }")
      .top
        TokenImage(:src="$tokenLogo(market.quote_token.symbol.name, market.quote_token.contract)" height="25")
        span.ml-2 {{ market.symbol }}

      .bottom
        span {{ market.last_price }}
        ChangePercent(:change="market.changeWeek")

  .item-container
    el-button.token-promotion(@click="openInNewTab('https://t.me/avral')" type="text" icon="el-icon-circle-plus-outline") {{ $t('Token promotion') }}
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
        }).reverse()
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
    background-color: var(--hover);
    border: 1px solid var(--dark-btn-sm);
  }

}

.section-title {
  margin-bottom: 25px !important;
}

.items {
  display: flex;
  flex-wrap: wrap;
  gap: 34px;
  justify-content: flex-start;
}

.item-container {
  padding-left: 0;
  width: 254px;

  @media only screen and (max-width: 600px) {
    width: 154px;
  }
}

.item {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-radius: 4px;
  height: 64px;
  font-size: 12px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid var(--dark-btn-sm);
  color: var(--text-default) !important;
  transition: all .3s;

  img {
    height: 20px;
  }

  &:hover {
    background-color: var(--hover);
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
  .items {
    gap: 16px;
    justify-content: center;
  }

  .recommented-markets {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
}

@media only screen and (max-width: 600px) {
  .item-container {
    width: 154px;
    padding-left: 0px;
  }
}

@media only screen and (max-width: 440px) {
  .item-container {
    width: 154px;
  }

  //   .item{
  //       border: ;
  //   }
}

@media only screen and (max-width: 600px) {}

@media only screen and (max-width: 440px) {}
</style>
