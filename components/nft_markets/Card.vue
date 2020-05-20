<template lang="pug">
el-card(v-loading="loading")
  .row
    .col
      div(v-for="nft in nfts")
        img.image(src='https://shadow.elemecdn.com/app/element/hamburger.9cf7b091-55e9-11e9-a976-7f4d0b07eef6.png')
        div(style='padding: 14px;')
          span ID: {{ nft.id }}
          .bottom.clearfix
            time.time '123.123'
            el-button.button(type='text') Operating
        el-button().w-100 Show
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  props: ['order'],

  data() {
    return {
      nfts: [],

      loading: true
    }
  },

  computed: {
    ...mapState(['network']),
    ...mapGetters('api', ['rpc'])
  },

  async mounted() {
    const nfts = []

    for (const id in this.order.sell) {
      const { rows: [item] } = await this.rpc.get_table_rows({
        code: 'simpleassets',
        scope: this.network.nftMarket.contract,
        table: 'sassets',
        lower_bound: id,
        limit: 1
      })

      nfts.push(item)
    }

    this.nfts = nfts
    this.loading = false
  }
}
</script>
