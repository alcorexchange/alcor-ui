<template lang="pug">
.layout-header-search
  ElPopover(trigger="focus" v-model="visible" :visibleArrow="false" width="240" popperClass="layout-search-popper" )
    template(#reference)
      ElInput(placeholder="Search tokens" v-model="search" size="small" prefix-icon="el-icon-search")
    div.dropdown-content
      .tabs
        AlcorButton(@click="activeTab = 'tokens'" :class="{active: activeTab === 'tokens'}").tab-item.fs-14 Top Tokens
        AlcorButton(@click="activeTab = 'pools'" :class="{active: activeTab === 'pools'}").tab-item.fs-14 Top Pools
        //- ElRadioGroup(v-model="activeTab" size="small")
        //-   ElRadioButton(label="tokens") Top Tokens
        //-   ElRadioButton(label="pools") Top Pools
      .main
        RecycleScroller(
          class="virtual-scroller"
          :items="filteredTokens"
          :itemSize="38"
          v-if="filteredTokens.length"
        )
          template(#default="{ item }")
            .item.token-item.pointer.hover-bg-lighter
              .start
                .image
                  TokenImage(
                    :src='$tokenLogo(item.symbol, item.contract)',
                    height="20"
                  )
                span.symbol {{ item.symbol }}
                span.contract.muted.fs-12 {{ item.contract }}
              .end.fs-12
                .price ${{ item.usd_price.toFixed(4) }}
        .no-items(v-else) No Tokens Found.
</template>

<script>
import { mapState } from 'vuex'
import AlcorButton from '~/components/AlcorButton'
import TokenImage from '~/components/elements/TokenImage'

export default {
  name: 'LayoutHeaderSearch',
  components: {
    AlcorButton,
    TokenImage,
  },
  data: () => ({
    search: '',
    visible: false,
    activeTab: 'tokens',
  }),
  computed: {
    ...mapState(['tokens']),
    filteredTokens() {
      if (!this.tokens) return []

      const temp = [...this.tokens]

      if (!this.search.trim()) return temp

      return temp.filter((token) =>
        Object.values(token).some((v) => `${v}`.toLowerCase().includes(this.search.toLowerCase()))
      )
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
      font-size: 14px;
      background: transparent !important;
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
}
</style>
