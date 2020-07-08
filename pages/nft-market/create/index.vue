<template lang="pug">
.row.mt-3
  .col-lg-5
    el-card
      div(slot="header")
        .lead NFT creation
          small.text-muted.float-right (Alpha version)

        small This form allows you to create an NFT.
          |  You will be the owner of the NFT immediately after creation and will be able to transfer or sell the NFT.

      .row

      .row
        .col
          label Category
          el-input(v-model='category', placeholder='Category' maxlength="12" show-word-limit)

      hr
      .row
        .col
          .row
            .col
              pre Immutable data
              span Data that can never be changed again.
              el-input(v-model="iKey" placeholder="key")
          .row.mt-1
            .col
              el-input(v-model="iValue" placeholder="value")
      .row.mt-1
        .col
          el-button(size="mini" type="primary" @click="addI") Add

      hr
      .row
        .col
          .row
            .col
              b.text-muted Mutable data
              p Data that you can change(as the author of the NFT).

              span.mr-1.text-muted Recommended fields:
              el-tag(size="small" @click="mKey = 'name'").pointer name
              el-tag(size="small" @click="mKey = 'img'").pointer.ml-1 img

              el-input(v-model="mKey" placeholder="key").mt-1
          .row.mt-1
            .col
              el-input(v-model="mValue" placeholder="value")
      .row.mt-1
        .col
          el-button(size="mini" type="primary" @click="addM") Add

  .col-lg-7
    el-card.preview-wrap
      div(slot="header")
        .lead NFT Preview

      .row
        .col-4
          img(v-if="preview.mdata.img" :src="preview.mdata.img").w-100
        .col-8
          .row.mb-1
            .col
              b.text-muted Category:
              |  {{ preview.category }}

          .row.mb-1
            .col
              b.text-muted Immutable data:
              ul
                li(v-for="item in iRows" v-if="item[1]")
                  span.text-muted {{ item[0] }}:
                  span  {{ item[1] }}

                  i.el-icon-close.pointer.ml-1(@click="delI(item[0])")
          .row
            .col
              b.text-muted Mutable data:
              ul
                li(v-for="item in mRows" v-if="item[1]")
                  span.text-muted {{ item[0] }}:
                  span  {{ item[1] }}

                  i.el-icon-close.pointer.ml-1(@click="delM(item[0])")

      PleaseLoginButton
        el-button(type="primary" :loading="loading" @click="create").w-100 Create NFT

</template>

<script>
import { mapState, mapGetters } from 'vuex'
import { prepareNFT } from '~/utils'

import PleaseLoginButton from '~/components/elements/PleaseLoginButton'

export default {
  components: {
    PleaseLoginButton
  },

  data() {
    return {
      category: '',
      idata: {},
      mdata: {},

      iKey: '',
      iValue: '',

      mKey: '',
      mValue: '',

      loading: false
    }
  },

  computed: {
    ...mapState(['network', 'user']),

    iRows() {
      return Object.entries(this.idata)
    },

    mRows() {
      return Object.entries(this.mdata)
    },

    preview() {
      const nft = JSON.parse(JSON.stringify({
        category: this.category,
        idata: JSON.stringify(this.idata),
        mdata: JSON.stringify(this.mdata)
      }))

      prepareNFT(nft)
      console.log(nft)

      return nft
    }
  },

  mounted() {
  },

  methods: {
    delI(key) {
      this.$set(this.idata, key, undefined)
      delete this.idata[key]
    },

    delM(key) {
      this.$set(this.mdata, key, undefined)
      delete this.mdata[key]
    },

    addI() {
      this.$set(this.idata, this.iKey, this.iValue)
      this.iKey = ''
      this.iValue = ''
    },

    addM() {
      this.$set(this.mdata, this.mKey, this.mValue)
      this.mKey = ''
      this.mValue = ''
    },

    async create() {
      const actions = [
        {
          account: 'simpleassets',
          name: 'create',
          authorization: [
            {
              actor: this.user.name,
              permission: 'active'
            }
          ],
          data: {
            author: this.user.name,
            category: this.category.toLowerCase(),
            owner: this.user.name,
            idata: JSON.stringify(this.idata),
            mdata: JSON.stringify(this.mdata),
            requireclaim: false
          }
        }
      ]

      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$router.push({ name: 'nft-market' })
        this.$notify({ title: 'NFT Creation', message: 'NFT Created!', type: 'success' })
      } catch (e) {
        this.$notify({ title: 'NFT Creation', message: e, type: 'error' })
      } finally {
        this.loading = false
      }
    }
  },

  head() {
    return {
      title: `Alcor NFT Market | Create you ownt NFT tokens`,

      meta: [
        { hid: 'description', name: 'description', content: `Atomic, NFT creation form` }
      ]
    }
  }
}
</script>

<style>
.market-cards .el-card__header {
  padding: 10px 20px;
}

.market-cards {
  display: flex;
  flex-wrap: wrap!important;
  justify-content: space-between;
}

.market-cards .item {
  width: 32.8%;
  margin-bottom: 10px;
}

@media only screen and (max-width: 600px) {
  .market-cards .item {
    width: 100%;
  }
}

.preview-wrap {
  overflow-wrap: anywhere;
}

</style>
