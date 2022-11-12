<template lang="pug">
#createnft-page.j-container.d-flex.flex-column.gap-40
  .mt-3
    nuxt-link(:to="localePath('nft-market', $i18n.locale)" :exact='true')
      #return-btn Return
    .d-flex.justify-content-between.align-items-center.mt-3
      .d-flex.flex-column
        h4 My Collections
        .fs-14.disable All NFTs are a part of a larger collection, please create a new collection or add
          |
          | to an existing one.
      memory-panel
  .d-flex.gap-30.flex-wrap
    nuxt-link(:to='"/nft-market/createcollection"', :exact='true')
      .create-collection-card
        .plus-round-background(
          :style='{ backgroundImage: `url(${require("~/assets/images/add_icon.svg")})`, backgroundRepeat: "no-repeat", backgroundPosition: "center" }')
        h4.text-center Create <br>Collection
    vue-skeleton-loader(
      v-if='loading'
      :width='220',
      :height='353',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true',
    )
    my-collection-card(
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
import MyCollectionCard from '~/components/cards/MyCollectionCard'

export default {
  components: {
    MemoryPanel,
    MyCollectionCard,
    VueSkeletonLoader
  },

  data() {
    return {
      collectionData: [],
      loading: true
    }
  },

  computed: {
    ...mapState(['network', 'user']),

    userData() {
      return this.user
    }
  },

  watch: {
    userData(newUserData, oldUserData) {
      if (!oldUserData && newUserData) {
        this.getCollectionData(this.user.name)
      }
    }
  },

  mounted() {
    if (this.user) {
      this.getCollectionData(this.user.name)
    }
  },

  methods: {
    async getCollectionData(author) {
      this.loading = true
      const data = await this.$store.dispatch('api/getMyCollections')
      console.log('ddddd', data)
      this.collectionData = data
      this.loading = false
    }
  }
}
</script>

<style lang="scss">
#createnft-page {
  .border-radius5 {
    border-radius: 5px;
  }

  .plus-round-background {
    width: 70px;
    height: 70px;
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
    display: flex;
    gap: 5px;
  }

  .page-header h4 {
    margin: 0 0 8px 0 !important;
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
}

.green-border {
  border: 2px solid var(--main-action-green);
}

.create-collection-card {
  width: 220px;
  height: 353px;
  background: var(--background-color-third);

  border: 2px solid var(--main-action-green);
  border-radius: 10px;

  display: flex;
  gap: 24px;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  font-size: 24px;
  font-weight: 700;

  color: var(--text-default);

  transition: all 0.3s;

  &:hover {
    box-shadow: 0px 0px 30px 0px #54a05466 inset;
    background: var(--btn-outline);
  }
}
</style>
