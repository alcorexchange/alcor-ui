<template lang="pug">
el-dialog(:visible.sync="active" width="40%" title="Select Token").token-select-dialog
    el-input.search(v-model="search" placeholder="Search name")
    SSpacer
    .list
        .item(v-for="{symbol, contract} in tokensList" @click="onItemClick({symbol, contract})")
            //- img.token-logo(src="https://cdn.worldvectorlogo.com/logos/ethereum-eth.svg")
            TokenImage.token-image(:src="$tokenLogo(symbol, contract)" height="24")
            .main
                .left
                    span.symbol {{symbol}}
                    span.name {{contract}}
                .right
                    span.balance 0
</template>

<script>
import { mapGetters } from 'vuex'
import SSpacer from '@/components/SSpacer.vue'
import TokenImage from '@/components/elements/TokenImage.vue'
export default {
  name: 'TokenSelectDialog',
  components: {
    TokenImage,
    SSpacer
  },
  data: () => ({
    active: false,
    search: '',
    tokensList: [],
    onSelect: null
  }),
  methods: {
    openDialog({ onSelect }) {
      this.active = true
      this.onSelect = onSelect
      this.getTokensList()
    },
    async getTokensList() {
      const res = await this.getTokens()
      console.log(res)
      this.tokensList = res
    },
    onItemClick(token) {
      this.onSelect(token)
      this.active = false
    },
    ...mapGetters({
      getTokens: 'swap/tokens0'
    })
  }
  //   TODO: not working in computed
  //   computed: {
  //     ...mapGetters({
  //       getTokens: 'swap/tokens0'
  //     })
  //   }
}
</script>

<style scoped lang="scss">
// .search {
//   position: sticky;
//   top: 10px;
//   z-index: 80;
// }
.list {
  max-height: 300px;
  overflow-y: auto;
}
.item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-2);
  transition: background 0.3s;
  cursor: pointer;
  margin-bottom: 2px;
  &:hover {
    background: var(--hover);
  }
}
.token-image {
  margin-right: 12px;
}
.main {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .left {
    display: flex;
    flex-direction: column;
    .name {
      opacity: 0.6;
      font-size: 0.9rem;
    }
  }
}
</style>
