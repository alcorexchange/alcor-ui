<template lang="pug">
// TODO Refactor with walidators for form
div
  el-button(size="medium" type="primary" @click="open").w-100  Sell NFT's

  el-dialog(title="Create new order", :visible.sync="visible" width="50%" v-if="user")
    .row
      .col
        .lead This form allow you to sell one or multiple NFT's at once by fixed price in {{ network.baseToken.symbol }}
    .row
      .col
        h4 Sell {{ sell.length }} items
        .sell-nft-box
          el-tag(v-for="nft in sell" closable @close="rmSell(nft)").mr-2.mb-2
            img(:src="nft.mdata.img" height=20)

            b {{ nft.id }}

        .label Sell all items for({{ network.baseToken.symbol }} amount):
        el-input(type="number" v-model="buy" @change="buyChange" clearable).w-100.mb-2
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

        el-button(type="primary" @click="submit" :loading="loading" :disabled="!sell.length").w-100 Sell
        hr

    .row
      .col-4
        .lead Select NFT's
      .col-8
        el-input(placeholder="Filter NFT's" size="small")
    hr
    el-card(v-for="nft in userNfts" shadow="hover" @click.native="addSell(nft)").pointer.mb-1
      .row
        .col-lg-2
          img(:src="nft.mdata.img" height=80)
        .col-lg-10
          .d-flex.flex-column
            .lead {{ nft.idata.name }}
            b ID: {{ nft.id }}
            span Category: {{ nft.category }}
            div.ml-auto
              span.mr-1 Author
              a(:href="monitorAccount(nft.author)" target="_blank") {{ nft.author }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { captureException } from '@sentry/browser'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      visible: false,

      buy: 0.0,

      userNfts: [],
      sell: [],

      loading: false
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user']),
    ...mapGetters('api', ['rpc'])
  },

  created() {
  },

  methods: {
    addSell(nft) {
      if (this.sell.filter(n => n.id == nft.id).length > 0) {
        return this.$notify({ title: 'Sell', message: 'Already selected', type: 'info' })
      }

      this.sell.push(nft)
    },

    rmSell(nft) {
      this.sell = this.sell.filter(n => n.id != nft.id)
    },

    buyChange() {
      console.log('buy change', this.buy)
      this.buy = parseFloat(this.buy).toFixed(this.network.baseToken.precision)
    },

    async fetchUserNfts() {
      const { rows } = await this.rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.user.name,
        table: 'sassets',
        limit: 1000
      })

      const nfts = []
      rows.map(nft => {
        nft.mdata = JSON.parse(nft.mdata)
        nft.idata = JSON.parse(nft.idata)

        nfts.push(nft)
      })
      this.userNfts = nfts
    },

    async open() {
      if (!await this.$store.dispatch('chain/asyncLogin')) return
      this.fetchUserNfts()
      this.visible = true
    },

    async submit() {
      this.loading = true

      try {
        await this.$store.dispatch('chain/sendTransaction', [
          {
            account: 'simpleassets',
            name: 'transfer',
            authorization: [
              {
                actor: this.user.name,
                permission: 'active'
              }
            ],
            data: {
              from: this.user.name,
              to: this.network.nftMarket.contract,
              assetids: this.sell.map(s => s.id),
              memo: `place|${this.buy} ${this.network.baseToken.symbol}@${this.network.baseToken.contract}`
            }
          }
        ])

        this.$notify({ title: 'Order placed', message: 'Order placed successfully', type: 'success' })
        this.visible = false

        this.buy = 0.0

        this.userNfts = []
        this.sell = []

        this.$store.dispatch('nft/fetch')
      } catch (e) {
        captureException(e, { extra: { buy: this.buy, sell: this.sell } })
        this.$notify({ title: 'Place order', message: e.message, type: 'error' })
        console.log(e)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.el-form {
  /*padding: 10px 70px; */
}

.sell-nft-box {
  min-height: 50px;
}
</style>
