<template lang="pug">
.fees-page
  h2.fees-page__title {{ $t('Trading Fees') }}

  section.fees-page__description
    p {{ $t('Alcor has different fees based on the type of transaction you want to do') }}.

    .read-more(v-if="isMobile && !isOpen" @click="toggle") Read more...
    .more-text(v-if="isMobile && isOpen || !isMobile")
      p
        b {{ $t('Swap') }}
        |  - {{ $t('When using the swap there is a .3% liquidity provider fee. This fee gets distributed between those providing liquidity in the pool') }}.

      p
        b {{ $t('Market Exchange') }}
        |  - {{ $t('When placing a market or limit order there is a .2% exchange fee on only 4 markets. Certain markets will not have fees depending on the Alcor governance decision. This exchange fee goes towards the Alcor development fund') }}.

      p
        b {{ $t('OTC Transaction') }}
        |  - {{ $t('Each exchange is charged a commission of 0.25% for both tokens if the transaction amount is sufficient. Otherwise, for small amounts, no commission will be charged This fee also goes towards the Alcor development fund') }}.
    .read-less(v-if="isMobile && isOpen" @click="toggle") Close

  .fees-page__pre
    h3 {{ $t('Fees table') }}
    el-input(
      size='small',
      v-model='search',
      prefix-icon='el-icon-search'
      :placeholder='$t("Search name or address")',
      clearable
    )

  .fees-page__table
    el-table(:data="feeMarkets" :default-sort='{ prop: "symbol" }')
      el-table-column(:label='$t("Token Pair")', :width='isMobile ? "160px" : "320px"', sortable, sort-by='symbol')
        template(slot-scope='{row}')
          .name
            TokenImage(:src="$tokenLogo(row.quote_token.symbol.name, row.quote_token.contract)" height="25")
            span {{ row.symbol }}

      el-table-column(:label='isMobile ? $t("Maker") : $t("Market Maker")', :width='isMobile ? "60px" : "200px"')
        template(slot-scope='{row}')
          span.fee {{ row.fee / 100 }}%

      el-table-column(:label='isMobile ? $t("Taker") : $t("Market Taker")', :width='isMobile ? "60px" : "200px"')
        template(slot-scope='{row}')
          span.fee {{ row.fee / 100 }}%

      el-table-column(:label='$t("Swap")', :width='isMobile ? "60px" : "200px"')
        template(slot-scope='{row}')
          span.fee 0.3%

      el-table-column(v-if="!isMobile" :label='$t("OTC")', width='200px')
        template(slot-scope='{row}')
          span.fee 0.25%
</template>

<script>
import { mapState } from 'vuex'
import TokenImage from '~/components/elements/TokenImage'


export default {
  components: {
    TokenImage
  },
  data: () => ({ search: '', isOpen: false }),
  computed: {
    ...mapState(['markets']),

    feeMarkets() {
      return this.markets
        .filter(({ fee }) => !!fee)
        .filter(({ slug }) => slug.includes(this.search.toLowerCase()))
    }
  },
  methods: {
    toggle() {
      this.isOpen = !this.isOpen
    }
  }

}

</script>

<style lang="scss">
.fees-page {
  padding-top: 48px;

  &__title {
    font-size: 68px;
    font-weight: bold;

    @media only screen and (max-width: 840px) {
      font-size: 32px;
    }

  }

  &__description {
    width: 750px;
    font-size: 20px;

    .read-more,
    .read-less {
      color: var(--main-green);
      font-weight: 600;
      cursor: pointer;
    }

    @media only screen and (max-width: 840px) {
      width: 100%;
    }

  }

  &__pre {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 56px;

    @media only screen and (max-width: 840px) {
      flex-direction: column;
      align-items: flex-start;
    }


    .el-input {
      width: 300px;

      @media only screen and (max-width: 840px) {
        width: 100%;
      }

    }

    .el-input__inner {
      background-color: var(--bg-alter-2);

      @media only screen and (max-width: 840px) {
        font-size: 16px;
      }

    }
  }

  &__table {
    margin-top: 30px;

    .el-table {
      border-radius: 8px;

      tr {
        background-color: var(--background-color-third);
      }
    }

    .name {
      display: flex;
      gap: 10px;
    }
  }
}
</style>
