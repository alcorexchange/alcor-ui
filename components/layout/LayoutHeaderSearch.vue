<template lang="pug">
.layout-header-search
  ElPopover(trigger="focus" v-model="visible" :visibleArrow="false" width="240" popperClass="layout-search-popper" )
    template(#reference)
      ElInput(placeholder="Search tokens" v-model="search" size="small" prefix-icon="el-icon-search")
    div.dropdown-content
      .tabs
        AlcorButton(@click="activeTab = 'tokens'" :class="{active: activeTab === 'tokens'}" compact).tab-item
          span.fs-12 Top Tokens
        AlcorButton(@click="activeTab = 'pools'" :class="{active: activeTab === 'pools'}" compact).tab-item
          span.fs-12 Top Pools
        //- ElRadioGroup(v-model="activeTab" size="small")
        //-   ElRadioButton(label="tokens") Top Tokens
        //-   ElRadioButton(label="pools") Top Pools
      .main
        div(v-if="activeTab === 'tokens'" key="tokens")
          RecycleScroller(
            class="virtual-scroller"
            :items="filteredTokens"
            :itemSize="38"
            v-if="filteredTokens.length"
          )
            template(#default="{ item }")
              NuxtLink(:to="localeRoute(`/analytics/tokens/${item.id}`)" @click="handleItemClick").item.token-item.pointer.hover-bg-lighter
                .start
                  .image
                    TokenImage(
                      :src='$tokenLogo(item.symbol, item.contract)',
                      height="18"
                    )
                  span.symbo.fs-14 {{ item.symbol }}
                  span.contract.muted.fs-10 {{ item.contract }}
                .end.fs-12
                  .price ${{ item.usd_price.toFixed(4) }}
          .no-items(v-else) No Tokens Found.
        div(v-else key="pools")
          RecycleScroller(
            class="virtual-scroller"
            :items="filteredPools"
            :itemSize="48"
            v-if="filteredPools.length"
          )
            template(#default="{ item }")
              NuxtLink(:to="localeRoute(`/analytics/pools/${item.id}`)" @click="handleItemClick").item.pool-item.pointer.hover-bg-lighter
                .image
                  PairIcons(
                    :token1="{contract: item.tokenA.contract, symbol: item.tokenA.symbol}"
                    :token2="{contract: item.tokenB.contract, symbol: item.tokenB.symbol}"
                    size="16"
                  )
                .pool-item-details
                  .pool-item-details-head
                    div.symbol.fs-14 {{ item.tokenA.symbol }} / {{ item.tokenB.symbol }}
                    Tag {{ item.fee / 10000 }} %
                  span.muted.fs-10 {{ item.tokenA.contract }} / {{ item.tokenB.contract }}
          .no-items(v-else) No Pools Found.
</template>

<script>
import { mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import Tag from '~/components/elements/Tag'

export default {
  name: 'LayoutHeaderSearch',
  components: {
    AlcorButton,
    TokenImage,
    PairIcons,
    Tag,
  },
  data: () => ({
    search: '',
    visible: false,
    activeTab: 'tokens',
  }),
  computed: {
    ...mapState(['tokens']),
    ...mapState('amm', ['poolsStats']),
    filteredTokens() {
      if (!this.tokens) return []

      const temp = [...this.tokens]

      if (!this.search.trim()) return temp

      return temp.filter((token) =>
        Object.values(token).some((v) => `${v}`.toLowerCase().includes(this.search.toLowerCase()))
      )
    },
    filteredPools() {
      if (!this.poolsStats) return []

      const temp = [...this.poolsStats]

      if (!this.search.trim()) return temp

      return temp.filter((pool) =>
        // Only search in token object
        [...Object.values(pool.A), ...Object.values(pool.tokenB)].some((v) =>
          `${v}`.toLowerCase().includes(this.search.toLowerCase())
        )
      )
    },
  },
  methods: {
    handleItemClick() {
      this.visible = false
      this.search = ''
    },
  },
}
</script>

<style lang="scss">
.layout-header-search {
  width: 240px;
}
</style>

<style lang="scss">
.layout-search-popper {
  background: var(--background-color-third) !important;
  padding: 0 !important;

  .tabs {
    padding: 8px;
    display: flex;
    gap: 4px;
    .tab-item {
      background: transparent !important;
      &:hover {
        background: var(--hover) !important;
      }
      &.active {
        background: var(--btn-default) !important;
      }
    }
  }

  .virtual-scroller {
    max-height: 320px;
  }

  .dropdown-content {
    display: flex;
    flex-direction: column;
  }
  .main {
    flex: 1;
  }

  .item {
    padding: 8px;
    color: var(--text-default);
  }
  .token-item {
    height: 38px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .start {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .pool-item {
    height: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    .pool-item-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      .pool-item-details-head {
        align-items: center;
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
