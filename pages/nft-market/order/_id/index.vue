<template lang="pug">
el-card.box-card.mt-3(v-if='!no_found')
  .row.mb-2
    .col
      el-alert(type='error', title='Beware of scammers!', show-icon)
        p
          | Anyone can create SimpleAssets NFTs and freely choose attributes such as name and image, including fake versions of existing NFTs or stolen intellectual property.
          | Before buying an NFT, always do your own research about the collection and double check the collection name to ensure that you are buying genuine NFTs.

  .clearfix(slot='header')
    el-page-header(@back='goBack')
      template(slot='content')
        .d-flex
          .lead.mr-5 {{ order.buy.quantity }}
          span.mr-1 Order {{ order.id }} created by
          a(:href='monitorAccount(order.maker)', target='_blank') {{ order.maker }}
  .text.item(v-loading='loading')
    .row.mb-3
      .col
        el-card.pointer.mb-1(
          v-for='(nft, i) in nfts',
          shadow='hover'
          :key="nft.id + i"
        )
          .row
            .col-lg-4
              img.order-img(
                :src='nft.mdata.img',
                height='250',
                @error='setOriginalSrc'
              )
            .col-lg-8
              NftFields(:nft='nft')

            //.col-lg-5
              .d-flex.flex-column
                span(v-for="(key, value) in nft.idata")
                  | {{ key }} {{ value }}

                div.ml-auto
                  span.mr-1 Author
                  a(:href="monitorAccount(nft.author)" target="_blank") {{ nft.author }}

    PleaseLoginButton
      el-button.w-100(
        v-if='user && order.maker == user.name',
        type='warning',
        @click='cancelOrder'
      ) Cancel order
      el-button.w-100(v-else, type='primary', @click='buy') Buy for {{ order.buy.quantity }}

  //.text.item(v-if="order.maker")
    .row.mb-3
      .col-6.text-center.bordered
        h2 Sell

        hr

        TokenImage(:src="$tokenLogo(order.sell.quantity.split(' ')[1], order.sell.contract)" height="50").mr-2.mb-2

        .lead {{ order.sell.quantity }}@
          a(:href="monitorAccount(order.sell.contract)" target="_blank") {{ order.sell.contract }}
      .col-6.text-center
        h2 Buy

        hr

        TokenImage(:src="$tokenLogo(order.buy.quantity.split(' ')[1], order.buy.contract)" height="50").mr-2.mb-2

        .lead {{ order.buy.quantity }}@
          a(:href="monitorAccount(order.buy.contract)" target="_blank") {{ order.buy.contract }}

    PleaseLoginButton
      el-button(v-if="user && order.maker == user.name" type="warning" @click="cancelOrder").w-100 Cancel order
      el-button(v-else type="primary" @click="buy").w-100 Buy
        |  {{ order.sell.quantity }}@{{ order.sell.contract }}

//el-card(v-else).box-card.mt-3
  .clearfix(slot='header')
    span Order: {{ id }}
    el-button(@click="$router.push({name: 'index'})" style='float: right; padding: 3px 0', type='text') Go to main page
  .text.item.text-center
    h1.display-4 Order {{ id }} not found or finished
</template>

<script>
import { captureException } from '@sentry/browser'
import { mapState, mapActions, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'
import PleaseLoginButton from '~/components/elements/PleaseLoginButton'
import NftFields from '~/components/nft_markets/NftFields'

import { prepareNFT } from '~/utils'

export default {
  components: {
    TokenImage,
    PleaseLoginButton,
    NftFields
  },

  async asyncData({ store, error, params, $rpc }) {
    try {
      const {
        rows: [order]
      } = await $rpc.get_table_rows({
        code: store.state.network.nftMarket.contract,
        scope: store.state.network.nftMarket.contract,
        table: 'sellorders',
        lower_bound: params.id,
        limit: 1
      })

      if (order && order.id == params.id) {
        return { order, loading: false }
      } else {
        // TODO Redirect if order in history
        error({
          message: `Order ${params.id} not found or finished`,
          statusCode: 404
        })
      }
    } catch (e) {
      captureException(e)
      return error({ message: 'Error fetching order: ' + e, statusCode: 500 })
    }
  },

  data() {
    return {
      order: {},
      no_found: false,
      loading: true,
      nfts: []
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user'])
  },

  async mounted() {
    const nfts = []
    this.loading = true

    // TODO Create global base of nft tokens that contract holds
    for (const id of this.order.sell) {
      const {
        rows: [item]
      } = await this.$rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.network.nftMarket.contract,
        table: 'sassets',
        lower_bound: id,
        limit: 1
      })

      prepareNFT(item)

      nfts.push(item)
    }

    this.nfts = nfts
    this.loading = false
  },

  methods: {
    ...mapActions('chain', ['login', 'transfer', 'sendTransaction']),

    setOriginalSrc(event) {
      event.target.src = event.target.src.replace(
        'https://images.hive.blog/0x0/',
        ''
      )
    },

    async cancelOrder(order) {
      try {
        const order = this.order

        await this.sendTransaction([
          {
            account: this.$store.state.network.nftMarket.contract,
            name: 'cancelsell',
            authorization: [
              {
                actor: order.maker,
                permission: 'active'
              }
            ],
            data: { maker: order.maker, order_id: order.id }
          }
        ])

        this.$notify({
          title: 'Success',
          message: `Order canceled ${order.id}`,
          type: 'success'
        })
        this.$router.push({ name: 'nft-market' })
        //this.$store.dispatch('nft/fetch')
      } catch (e) {
        captureException(e, { extra: { order } })
        this.$notify({
          title: 'Place order',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      }
    },

    async buy() {
      const loading = this.$loading({
        lock: true,
        text: 'Wait for Scatter'
      })

      try {
        const { buy, id } = this.order

        await this.transfer({
          to: this.$store.state.network.nftMarket.contract,
          contract: buy.contract,
          actor: this.user.name,
          quantity: buy.quantity,
          memo: `fill|${id}`
        })
        this.$router.push({ name: 'nft-market' })
        this.$notify({
          title: 'Success',
          message: `You fill ${id} order`,
          type: 'success'
        })
      } catch (e) {
        captureException(e, { extra: { order: this.order } })
        this.$notify({
          title: 'Place order',
          message: e.message,
          type: 'error'
        })
        console.log(e)
      } finally {
        loading.close()
      }
    },

    goBack() {
      this.$router.go(-1)
    }
  },

  head() {
    return {
      title: `Alcor OTC swap | Sell ${this.order.sell.quantity} for ${this.order.buy.quantity} by ${this.order.maker}`
    }
  }
}
</script>

<style scoped>
.order-img {
  width: 100%;
  height: auto;
}
</style>
