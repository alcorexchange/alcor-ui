<template lang="pug">
.j-container.createnft
  div
    nuxt-link(:to='"/nft-market"', :exact='true')
      a#return-btn Return
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 My Collections
      p All NFTs are a part of a larger collection, please create a new collection or add
        |
        | to an existing one.
    MemoryPanel
  .grid-container.row
    nuxt-link(:to='"/nft-market/createcollection"', :exact='true')
      .nftcard.create-collections.border-radius5
        .card-content
          .plus-round-background(
            :style='{ backgroundImage: `url(${require("~/assets/images/plus_round_icon.svg")})` }'
          )
          h4 Create <br>Collection
    vue-skeleton-loader(
      v-if='loading'
      :width='220',
      :height='300',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
    )
    CollectionCard(
      v-else
      v-for='(item, index) in collectionData',
      :key='index',
      :data='item'
    )
</template>

<script>
import { mapState } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import MemoryPanel from '~/components/nft_markets/MemoryPanel'
import CollectionCard from '~/components/nft_markets/CollectionCard'

export default {
  components: {
    MemoryPanel,
    CollectionCard,
    VueSkeletonLoader,
  },

  data() {
    return {
      collectionData: [],
      loading: true,
    }
  },

  computed: {
    ...mapState(['network', 'user']),

    userData() {
      return this.user
    },
  },

  watch: {
    userData(newUserData, oldUserData) {
      if (!oldUserData && newUserData) {
        this.getCollectionData(this.user.name)
      }
    },
  },

  mounted() {
    if (this.user) {
      this.getCollectionData(this.user.name)
    }
  },

  methods: {
    async getCollectionData(author) {
      this.loading = true
      const data = await this.$store.dispatch('api/getCollectionData', {
        author,
      })
      this.collectionData = data
      this.loading = false
    },
  },
}
</script>

<style lang="scss">
.createnft {
  .border-radius5 {
    border-radius: 5px;
  }
  .plus-round-background {
    width: 70px;
    height: 70px;
    margin: auto;
  }
  .almemes h4 {
    margin: 30px 0 0 !important;
    color: #67c23a !important;
  }
  .card-content {
    margin-top: 50%;
    transform: translate(0, -20%);
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4 {
      margin: 10px 0;
      color: white;
    }
  }
  #return-btn::before {
    content: '←';
  }
  #return-btn {
    font-weight: 500;
    font-size: 14px;
    color: #9f979a !important;
    cursor: pointer;
    padding-left: 10px;
  }
  .page-header h4 {
    margin: 0 !important;
  }
  .page-header {
    margin: 32px 0 9px 0;
  }
  .card-group {
    margin-top: 32px;
  }
  .nftcard {
    width: 220px;
    height: 300px;
    border: 1px solid #67c23a;
  }
  .grid-container {
    display: grid;
    grid-template-columns: auto auto auto auto;
    gap: 25px;
  }
}
</style>
