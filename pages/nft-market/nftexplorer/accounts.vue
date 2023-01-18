<template lang="pug">
#nftexplorer-page
  .text-center(v-if="!$route.query.match") {{ $t('Accounts can only be searched') }}
  .d-flex.flex-wrap.gap-25(v-else)
    vue-skeleton-loader(
      v-if="!accounts"
      v-for="idx in [1,2,3,4]"
      :key="idx"
      :width='220',
      :height='320',
      animation='wave',
      wave-color='rgba(150, 150, 150, 0.1)',
      :rounded='true'
    )
    account-card(v-if="accounts" v-for="(item, index) in accounts" :key="index" :data="item")
</template>

<script>
import { mapActions } from 'vuex'
import VueSkeletonLoader from 'skeleton-loader-vue'
import AccountCard from '~/components/cards/AccountCard'

export default {
  components: { AccountCard, VueSkeletonLoader },
  data: () => ({
    accounts: null,
    debounce: null
  }),
  watch: {
    '$route.query.match'() {
      this.exploreAccounts()
    }
  },
  mounted() {
    this.exploreAccounts()
  },
  methods: {
    ...mapActions('api', [
      'getAccountDetails',
      'getAccountsData',
      'getinventorycounts'
    ]),
    exploreAccounts() {
      clearTimeout(this.debounce)
      if (!this.$route.query.match) return
      this.debounce = setTimeout(async () => {
        this.accounts = null
        const data = await this.getAccountsData({
          search: this.$route.query?.match || '',
          limit: 16
        })
        this.accounts = data.map(({ scope }) => ({
          name: scope,
          suggested_average: 0,
          assetsCount: 0,
          imgSrc: ''
        }))

        Promise.all(
          data.map(({ scope }) => {
            return this.getAccountDetails(scope)
          })
        ).then((r) => {
          r.forEach(({ data }, idx) => {
            this.accounts[idx].suggested_average =
              data.data.reduce(
                (acc, { suggested_median, token_precision }) =>
                  (acc += suggested_median / Math.pow(10, token_precision)),
                0
              ) / data.data.length
          })
          this.suggestedAverageLoaded = true
        })
        Promise.all(
          data.map(({ scope }) => {
            return this.getinventorycounts({ owner: scope })
          })
        ).then((r) => {
          r.forEach((count, idx) => {
            this.accounts[idx].assetsCount = count
          })
        })
      }, 600)
    }
  }
}
</script>

<style lang="scss" scoped>
#nftexplorer-page {
  width: 100%;
  max-width: 970px;
  margin: 20px auto;
}
</style>
