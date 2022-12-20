<template lang="pug">
.wallet-page.d-flex.flex-column.gap-32
  el-input.wallet-input-search(v-model='search' prefix-icon="el-icon-search" :placeholder="$t('Search name or address')")
  .cards.d-flex.gap-30.flex-wrap.justify-content-center.justify-content-md-start(v-if="accountsData")
    .add-friend-card.pointer(@click="openAddFriendModal")
      users(color="#67C23A" width="70" height="70")
      span Add Friend
    account-card(
      :isFriend="true"
      v-for='(item, index) in filteredFriends'
      :key='"accounts-" + index'
      v-if='item'
      :data="item"
    )

</template>

<script>
import { mapActions } from 'vuex'
import NormalCard from '~/components/nft_markets/NormalCard'
import AccountCard from '~/components/cards/AccountCard.vue'
import Users from '~/components/svg-icons/Users.vue'

export default {
  components: { NormalCard, Users, AccountCard },
  data: () => ({
    friendList: null,
    loading: false,
    assetsCountLoaded: false,
    suggestedAverageLoaded: false,
    accountsData: null,
    search: ''
  }),
  computed: {
    filteredFriends() {
      return this.accountsData.filter(({ name }) => name.includes(this.search))
    }
  },
  mounted() {
    this.getAccountsData()
  },
  methods: {
    ...mapActions('social', ['getFriendList']),
    ...mapActions('api', ['getAccountDetails', 'getinventorycounts']),
    ...mapActions('modal', ['addFriend']),
    getPrice() {
      const price = this.systemPrice
      return price
    },
    openAddFriendModal() {
      this.addFriend()
    },
    async getAccountsData() {
      this.loading = true
      this.suggestedAverageLoaded = false
      this.assetsCountLoaded = false
      this.friendList = await this.getFriendList()

      this.accountsData = this.friendList.map((friendName) => ({
        name: friendName,
        suggested_average: 0,
        assetsCount: 0,
        imgSrc: ''
      }))
      this.loading = false

      Promise.all(
        this.friendList.map((name) => {
          return this.getAccountDetails(name)
        })
      ).then((r) => {
        r.forEach(({ data }, idx) => {
          this.accountsData[idx].suggested_average =
            data.data.reduce(
              (acc, { suggested_median, token_precision }) =>
                (acc += suggested_median / Math.pow(10, token_precision)),
              0
            ) / data.data.length
        })
        this.suggestedAverageLoaded = true
      })

      Promise.all(
        this.friendList.map((name) => {
          return this.getinventorycounts({ owner: name })
        })
      ).then((r) => {
        r.forEach((count, idx) => {
          this.accountsData[idx].assetsCount = count
        })
        this.assetsCountLoaded = true
      })
    }
  }
}
</script>

<style lang="scss">
.cards {
  max-width: 970px;
  min-width: 370px;
  width: 100%;
  margin: 0 auto;
}

.add-friend-card {
  width: 220px;
  height: 320px;
  background: var(--background-color-third);

  border: 2px solid var(--main-action-green);
  border-radius: 10px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  font-size: 24px;
  font-weight: 700;

  color: var(--main-action-green);

  transition: all 0.3s;

  &:hover {
    box-shadow: 0px 0px 30px 0px #54a05466 inset;
    background: var(--btn-outline);
  }
}
</style>
