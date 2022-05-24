<template lang="pug">
.row.mt-3
  .col-lg-5.mb-2
    el-card
      div(slot="header")
        .lead NFT creation
          small.text-muted.float-right (Alpha version)

        small This form allow you to create an NFT.
          |  You will be the owner of the NFT immediately after creation and will be able to transfer or sell the NFT.

      .row
        .col
          small Name
          el-input(v-model='mdata.name', placeholder='Name of the NFT' show-word-limit)

      .row.mt-2
        .col
          small Category
          el-input(v-model='category', placeholder='Category' maxlength="12" show-word-limit)

      hr
      .row
        .col
          .row
            .col
              pre Immutable data
              small Data that can never be changed again.
              el-input(v-model="iKey" placeholder="key" size="small")
          .row.mt-1
            .col
              el-input(v-model="iValue" placeholder="value" size="small")
      .row.mt-1
        .col
          el-button(size="mini" type="primary" @click="addI") Add

      hr
      .row
        .col
          .row
            .col
              b.text-muted Mutable data
              p
                small.text-muted Data that you can change(as the author of the NFT).

              el-input(v-model="mKey" placeholder="key" size="small").mt-1
          .row.mt-1
            .col
              el-input(v-model="mValue" placeholder="value" size="small")
      .row.mt-1
        .col
          el-button(size="mini" type="primary" @click="addM") Add

  .col-lg-7
    el-card.preview-wrap
      div(slot="header")
        .lead {{ mdata.name }}

      .row
        .col-lg-4
          el-upload.avatar-uploader(
            action='/api/upload/ipfs'
            :show-file-list='false'
            :on-success='handleAvatarSuccess'
            :before-upload='beforeAvatarUpload'
            :on-error='onImgUploadErr'
            :loading="loading"
          )
            img.avatar(v-if='preview.mdata.img' :src='preview.mdata.img')
            i.el-icon-plus.avatar-uploader-icon(v-else)
        .col-lg-8
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
        el-button(type="primary" :loading="loading" @click="create").w-100.mt-2 Create NFT

</template>

<script>
import { mapState } from 'vuex'
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

      return nft
    }
  },

  mounted() {
  },

  methods: {
    onImgUploadErr(err) {
      this.$notify({ title: 'Place order', message: err, type: 'error' })
      this.loading = false
    },

    handleAvatarSuccess({ IpfsHash }) {
      this.$set(this.mdata, 'img', IpfsHash)
      this.loading = false
    },

    beforeAvatarUpload(file) {
      this.loading = true
    },

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
        this.$router.push({ name: 'wallet-index-nfts' })
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
      title: 'Alcor NFT Market | Create you ownt NFT tokens',

      meta: [
        { hid: 'description', name: 'description', content: 'Atomic, NFT creation form' }
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

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px !important;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

</style>
