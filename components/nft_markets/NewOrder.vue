<template lang="pug">
// TODO Refactor with walidators for form
div
  el-button(size="medium" type="primary" @click="open").w-100  Sell NFT's

  el-dialog(title="Create new order", :visible.sync="visible" width="70%" v-if="user")
    .row
      .col
        .lead This form allow you to sell one or multiple NFT's at once by fixed price in {{ network.baseToken.symbol }}
    .row
      .col
        h4 Sell {{ sell.length }} items
        .sell-nft-box
          el-card(
            v-for="(nft, i) in sell"
            :key="nft.id + i"
            closable
          ).mr-2.mb-2
            .row
              .col-lg-3
                .p-1
                  img(:src="nft.mdata.img" height=70)
              .col-lg-9
                .d-flex.flex-column.pl-2
                  i.el-icon-close.ml-auto(@click="rmSell(nft)").pointer.card-close
                  .lead {{ nft.mdata.name }}
                  b ID: {{ nft.id }}
                  //span Category: {{ nft.category }}
                  span Author
                    b.ml-1 {{ nft.author }}

        .label Sell all items for({{ network.baseToken.symbol }} amount):
        el-input.input-with-select(type="number" v-model="buyAmount" @change="buyChange" clearable).nft-buy-input
          el-select(v-model="buyToken", slot="append", placeholder="Select" value-key="str")
            el-option(
              :label="`${network.baseToken.symbol}@${network.baseToken.contract}`"
              :value="{str: 'base', symbol: { name: network.baseToken.symbol, precision: network.baseToken.precision }, contract: network.baseToken.contract }"
              )
              TokenImage(:src="$tokenLogo(network.baseToken.symbol, network.baseToken.contract)" height="25")
              span.ml-3 {{ network.baseToken.symbol }}@{{ network.baseToken.contract }}

            el-option(
              v-for="(token, i) in knownTokens"
              :label="`${token.symbol.name}@${token.contract}`"
              :value="token"
              :key="token.symbol.name + i"
              )
              TokenImage(:src="$tokenLogo(token.symbol.name, token.contract)" height="25")
              span.ml-3 {{ token.symbol.name }}@{{ token.contract }}

        //el-input(type="number" v-model="buy" @change="buyChange" clearable).w-100.mb-2
          span(slot="suffix").mr-1 {{ network.baseToken.symbol }}

        el-button(type="primary" @click="submit" :loading="loading" :disabled="!sell.length").w-100.mt-2 Sell
        hr

    .row
      .col-4
        .lead Select NFT's
      .col-8
        el-input(placeholder="Filter NFT's" size="small" v-model="search" clearable)
    hr
    el-card(
      v-for="(nft, i) in userNfts"
      :key="nft.id + i"
      shadow="hover"
      @click.native="addSell(nft)"
    ).pointer.mb-1
      .row
        .col-lg-2
          img(:src="nft.mdata.img" height=80)
        .col-lg-10
          .d-flex.flex-column
            .lead {{ nft.mdata.name }}
            b ID: {{ nft.id }}
            span Category: {{ nft.category }}
            div.ml-auto
              span.mr-1 Author
              a(:href="monitorAccount(nft.author)" target="_blank") {{ nft.author }}
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { captureException } from '@sentry/browser'
import { prepareNFT } from '~/utils'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  data() {
    return {
      visible: false,

      search: '',

      buyToken: {
        symbol: { name: '', precision: 4 },
        contract: ''
      },

      buyAmount: 0.0,

      userNfts_: [],
      sell: [],

      loading: false
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters(['user', 'knownTokens']),

    userNfts() {
      let nfts = this.userNfts_.filter(n => !this.sell.some(s => s.id == n.id))

      nfts = nfts.filter(s => {
        const nftSearchData = s.author + s.category + s.id + JSON.stringify(s.idata) + JSON.stringify(s.mdata)

        return nftSearchData.toLowerCase().includes(this.search.toLowerCase())
      })

      return nfts
    }
  },

  mounted() {
    this.buyToken.str = 'base'
    this.buyToken.contract = this.network.baseToken.contract
    this.buyToken.symbol = {
      name: this.network.baseToken.symbol,
      precision: this.network.baseToken.precision
    }
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
      this.buyAmount = parseFloat(this.buyAmount).toFixed(this.buyToken.symbol.precision)
    },

    async fetchUserNfts() {
      const { rows } = await this.$rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.user.name,
        table: 'sassets',
        limit: 1000
      })

      prepareNFT(rows)
      this.userNfts_ = rows
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
            authorization: [this.user.authorization],
            data: {
              from: this.user.name,
              to: this.network.nftMarket.contract,
              assetids: this.sell.map(s => s.id),
              memo: `place|${this.buyAmount} ${this.buyToken.symbol.name}@${this.buyToken.contract}`
            }
          }
        ])

        this.$notify({ title: 'Order placed', message: 'Order placed successfully', type: 'success' })
        this.visible = false

        this.buy = 0.0

        this.userNfts_ = []
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

<style>
.nft-buy-input .el-input-group__append {
  width: 20%;
}

.sell-nft-box {
  display: flex;
  min-height: 50px;
  flex-wrap: wrap!important;
}

.sell-nft-box .el-card__body {
  padding: 10px;
}

.card-close {
  position: absolute;
  right: 4px;
  top: -10px;
}
</style>
