<template lang="pug">
  div.nfts
    //- TODO: add search functionality
    //- .table-header
    //-   el-input(prefix-icon="el-icon-search" placeholder="Search name or paste address")
      //- TODO: Add filter
    .items
      .item-container(v-for="nft in nfts" :key="nft.id")
        NftCard(v-bind="nft" @showDetails="onShowDetails" @send="send")
    NftDetailPopup(ref="detailPopup")
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import NftCard from '@/components/wallet/NftCard'
import NftDetailPopup from '@/components/wallet/NftDetailPopup'
import { prepareNFT } from '~/utils'
export default {
  name: 'NFTs',
  components: {
    NftCard,
    NftDetailPopup
  },
  data: () => ({
    search: '',
    nfts: []
  }),
  computed: {
    ...mapGetters(['user']),
    ...mapState(['network', 'markets']),

    balances() {
      if (!this.user) return []
      if (!this.user.balances) return []

      return this.user.balances
        .filter((b) => {
          if (parseFloat(b.amount) == 0) return false

          return b.id.toLowerCase().includes(this.search.toLowerCase())
        })
        .sort((a, b) =>
          a.contract == this.network.baseToken.contract ? -1 : 1
        )
    }
  },
  watch: {
    user() {
      this.fetchNfts()
    }
  },
  mounted() {
    this.fetchNfts()
  },
  methods: {
    send({ nft }) {
      this.$prompt('NFT receiver account', 'Sent NFT', {
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel'
      }).then(async ({ value }) => {
        const authorization = [this.user.authorization]
        const actions = []

        try {
          await this.$rpc.get_account(value)
        } catch (e) {
          return this.$notify({
            title: 'Send NFT',
            message: "Receiver account doesn't exist",
            type: 'error'
          })
        }

        actions.push({
          account: 'simpleassets',
          name: 'transfer',
          authorization,
          data: {
            from: this.user.name,
            to: value,
            assetids: [nft.id],
            memo: 'alcor.exchange/wallet/nfts'
          }
        })

        try {
          await this.$store.dispatch('chain/sendTransaction', actions)

          this.$notify({
            title: 'Send NFT',
            message: 'NFT sent successfully!',
            type: 'success'
          })
          this.fetchNfts()
        } catch (e) {
          this.$notify({ title: 'Send NFT', message: e, type: 'error' })
          console.log(e)
        }
      })
    },

    async fetchNfts() {
      if (!this.user) return
      console.log('fetchNfts', this.user.name)

      const { rows } = await this.$rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.user.name,
        table: 'sassets',
        limit: 1000
      })

      rows.map((n) => {
        prepareNFT(n)
      })

      console.log(rows)
      this.nfts = rows
    },
    onShowDetails(fields) {
      this.$refs.detailPopup.openPopup({
        fields
      })
    }
  }
}
</script>

<style scoped lang="scss">
.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  .el-input {
    max-width: 300px;
  }
  .el-input__inner {
    background: transparent !important;
  }
}
.items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 56px;
}
@media only screen and (max-width: 1040px) {
  .items {
    gap: 20px;
  }
}
@media only screen and (max-width: 840px) {
  .items {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
@media only screen and (max-width: 540px) {
  .items {
    grid-template-columns: 100%;
    gap: 10px;
  }
}
</style>
