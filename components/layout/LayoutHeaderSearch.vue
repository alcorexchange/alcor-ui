<template lang="pug">
.layout-header-search
  ElPopover(trigger="focus" v-model="visible" :visibleArrow="false" width="240" popperClass="layout-search-popper" @after-leave="handleHide")
    template(#reference)
      ElInput(placeholder="Tokens & Accounts" v-model="search" size="small" prefix-icon="el-icon-search" @input="handleInput")
    div.dropdown-content
      .tabs
        AlcorButton(@click="activeTab = 'tokens'" :class="{active: activeTab === 'tokens'}" compact).tab-item
          span.fs-12 Tokens
        AlcorButton(@click="activeTab = 'pools'" :class="{active: activeTab === 'pools'}" compact).tab-item
          span.fs-12 Pools
        AlcorButton(@click="activeTab = 'accounts'" :class="{active: activeTab === 'accounts'}" compact).tab-item
          span.fs-12 Accounts
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
              NuxtLink(:to="localeRoute(`/analytics/tokens/${item.id}`)").item.token-item.pointer.hover-bg-lighter
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
        div(v-else-if="activeTab === 'pools'" key="pools")
          RecycleScroller(
            class="virtual-scroller"
            :items="filteredPools"
            :itemSize="48"
            v-if="filteredPools.length"
          )
            template(#default="{ item }")
              NuxtLink(:to="localeRoute(`/analytics/pools/${item.id}`)").item.pool-item.pointer.hover-bg-lighter
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

        Accounts(v-else key="accounts" :search="search" @close="visible = false")
</template>

<script>
import { mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'
import PairIcons from '~/components/PairIcons'
import Accounts from '~/components/layout/LayoutSearchAccounts'
import Tag from '~/components/elements/Tag'

export default {
  name: 'LayoutHeaderSearch',
  components: {
    AlcorButton,
    TokenImage,
    PairIcons,
    Tag,
    Accounts,
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
        [...Object.values(pool.tokenA), ...Object.values(pool.tokenB)].some((v) =>
          `${v}`.toLowerCase().includes(this.search.toLowerCase())
        )
      )
    },
  },
  watch: {
    '$route.path'() {
      this.visible = false
    },
  },
  methods: {
    handleInput() {
      if (!this.visible) this.visible = true
    },
    handleHide() {
      this.search = ''
    },
  },
}
</script>

<style lang="scss">
.layout-header-search {
  width: 180px;
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
      flex: 1;
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

  .no-items {
    padding: 40px 8px;
    text-align: center;
  }
}
</style>
