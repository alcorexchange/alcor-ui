<template lang="pug">
form#createcollection-form.j-container(@submit='handleSubmit', name='collectionForm')
  .mt-3
    nuxt-link(:to="localePath('nft-market-createnft', $i18n.locale)" :exact='true')
      #return-btn Return - My Collection
    .d-flex.justify-content-between.mt-1
      .d-flex.flex-column
        h4 Collection Creation
        .fs-14.disable All NFTs are a part of a larger collection, please create a new collection or add
          | to an existing one.
      memory-panel
  .card-group.d-flex.align-items-start
    .nftcard.create-collections.border-radius5
      .border-radius5(
        style='position: relative; height: 100%; overflow: hidden; background-color: #202021',
        @dragover.prevent='',
        @drop.prevent=''
      )
        el-upload.avatar-uploader(
          action='#',
          :auto-upload='false',
          :show-file-list='fileList.length ? true : false',
          :on-change='handleUpload',
          :loading='loading',
          :file-list='fileList',
          :on-remove='handleFileRemove',
          list-type='picture',
          drag
        )
        label.card-content
          .creation-background(
            :style='{ backgroundImage: `url(${require("~/assets/images/createcollection.svg")})` }'
          )
          h4 Add collection image
          h5 (click to browse)
    .mx-4
      .nft-input-group
        h4 Collection Name
        h5 (12 Characters, 1-5, a-z)
          span.color-red *
        input.m-0(
          type='text',
          maxlength='12',
          name='collection_name',
          @input='validationCollectionName',
          required
          placeholder='Insert collection name'
        )
        p.error-text(v-if='existingCollectionError') Collection Name is already in use.
      .nft-input-group
        h4 Display Name
          span.color-red *
        input(type='text', name='name', required placeholder='Insert Display name')
      .nft-input-group
        h4 Collection Fee
        h5 (0-10%)
          span.color-red *
        input(type='number', name='fee', min='0', max='10', required placeholder='1%')
      .nft-input-group
        h4 Website URL
        input(type='text', name='url' placeholder='Insert URL')
    .nftcard.nft-form-group.mb-4.flex-fill
      .nft-input-group.h-100.d-flex.flex-column.m-0
        h4 Description
        textarea.h-100.w-100(name="description")
  .d-flex.justify-content-end
    button.btn.create-collection-btn(
      :to='"/nft-market/collectionview"',
      :exact='true'
    ) Create Collection
</template>

<script>
import { mapState } from 'vuex'
import axios from 'axios'
import MemoryPanel from '~/components/nft_markets/MemoryPanel'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: {
    MemoryPanel,
    AlcorButton
  },

  data() {
    return {
      value: 73,
      files: [],
      loading: false,
      collectionName: '',
      fileList: [],
      existingCollectionError: false,
      collectionData: []
    }
  },
  computed: {
    ...mapState(['user'])
  },
  mounted() {
    this.getCollectionData()
  },
  methods: {
    validationCollectionName(event) {
      this.existingCollectionError = false
      clearTimeout(this.debounce)
      this.debounce = setTimeout(() => {
        const key = event.target.value
        const existingCollectionName = this.collectionData.find(
          (item) => item.collection_name === key
        )
        if (existingCollectionName) {
          this.existingCollectionError = true
        }
      }, 600)
    },
    async getCollectionData() {
      const data = await this.$store.dispatch('api/getCollectionData')
      this.collectionData = data
    },
    handleFileRemove(file, fileList) {
      const fileArray = []
      fileList.map((item) => fileArray.push({ url: item.url }))
      this.fileList = fileArray
    },
    async handleUpload(e) {
      const formData = new FormData()
      formData.append('image', e.raw)
      try {
        const data = await axios.put(
          'https://ipfs-gateway.pink.gg/v1/upload',
          formData
        )
        this.fileList.push({
          url: 'https://gateway.pinata.cloud/ipfs/' + data.data.data
        })
      } catch (e) {
        console.error('Get symbol info error', e)
      }
    },
    async handleSubmit(e) {
      e.preventDefault()
      const collectionForm = document.forms.collectionForm
      const formData = new FormData(collectionForm)
      const jsonData = Object.fromEntries(formData.entries())
      const dataArr = []
      dataArr.push({
        key: 'name',
        value: ['string', jsonData.name]
      })
      if (this.fileList.length) {
        dataArr.push({
          key: 'img',
          value: [
            'string',
            this.fileList[0]
              ? this.fileList[0].url.split(
                'https://gateway.pinata.cloud/ipfs/'
              )[1]
              : ''
          ]
        })
      }
      if (jsonData.url) {
        dataArr.push({
          key: 'url',
          value: ['string', jsonData.url]
        })
      }
      if (jsonData.description) {
        dataArr.push({
          key: 'description',
          value: ['string', jsonData.description]
        })
      }
      const actions = [
        {
          account: 'atomicassets',
          name: 'createcol',
          authorization: [
            {
              actor: this.user.name,
              permission: 'active'
            }
          ],
          data: {
            author: this.user.name,
            collection_name: jsonData.collection_name,
            allow_notify: true,
            authorized_accounts: [this.user.name],
            notify_accounts: [],
            market_fee: jsonData.fee * 0.01,
            data: dataArr
          }
        }
      ]
      this.loading = true
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Collection Creation',
          message: 'Collection Created!',
          type: 'success'
        })
        this.getCollectionData()
        this.$router.push(
          '/nft-market/createcollection/' + jsonData.collection_name
        )
      } catch (e) {
        this.$notify({
          title: 'Collection Creation',
          message: e,
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss">
#createcollection-form {
  .border-radius5 {
    border-radius: 5px;
  }

  .avatar-uploader {
    width: 100%;
    height: calc(100% - 6px);

    .el-upload {
      width: 100%;
      height: 100%;
      z-index: 1;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;

      :hover {
        border-color: #409eff;
      }
    }

    .el-upload-list__item {
      border: 0;
    }

    .el-upload-dragger {
      background-color: transparent;
      width: 100%;
      height: 100%;
      border: 0;
    }

    .el-upload-list {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      background-color: #202021;
      overflow-y: auto;

      li {
        background-color: transparent;
        width: 100%;
        height: 100%;
        padding: 20px;

        &:first-child {
          margin-top: 0;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
          margin-left: 0;
        }
      }
    }

    .avatar {
      width: 178px;
      height: 178px;
      display: block;
    }
  }

  .imgsPreview {
    width: 100%;
    height: 240px;
    padding: 10px 44px 10px;
    position: relative;
    z-index: 1;
    display: block;
    background: #202021 !important;
  }

  .beforeUpload {
    svg,
    p {
      display: none !important;
    }
  }

  .card-content {
    z-index: 0 !important;
  }

  .beforeUpload input[data-v-69bb59a3] {
    margin: -30px -30px;
    width: 290px;
    height: 290px;
    z-index: 999;
  }

  h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  label.card-content {
    position: absolute;
    background-color: #202021;
    top: 0;
    height: 100%;
  }

  div.container {
    border: none !important;
    background: none !important;
  }

  .nftcard.nft-form-group {
    border: none;
  }

  .nft-input-group {
    font-weight: 400;
    line-height: 21px;
    color: var(--cancel);
    margin-bottom: 12px;

    h4 {
      font-size: 18px !important;
    }

    h5 {
      font-size: 12px;
    }

    input {
      width: 233px;
      height: 24px;
      border-radius: 2px;
      color: var(--cancel);
      background-color: var(--btn-active);
      border: none;
      padding: 0 16px;
    }

    textarea {
      color: var(--cancel);
      background-color: var(--btn-active);
      border: none;
      border-radius: 2px;
      resize: none;
    }

    .error-text {
      color: #c33f39;
      font-size: 12px;
      font-weight: 700;
    }
  }

  .create-collection-btn {
    float: right;
    padding: 14px 23px;
    width: 154px;
    height: 48px;
    color: #000;
    font-size: 13px;
    font-weight: 500;
    background: #67c23a;
    border-radius: 8px;
    cursor: pointer;
  }

  .color-red {
    color: red;
  }

  .creation-background {
    width: 110px;
    height: 107px;
    margin: auto;
  }

  .almemes-background {
    width: 100px;
    height: 117px;
    margin: auto;
  }

  .almemes h4 {
    margin: 30px 0 0 !important;
    color: #67c23a;
  }

  .card-content {
    width: 100%;
    padding-top: 43px;
    font-weight: 700;
    font-size: 24px;
    text-align: center;

    h4 {
      margin: 10px 0 !important;
    }

    h5 {
      color: #9f979a;
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
    margin: 0 !important;
  }

  .page-header {
    margin: 32px 0 9px 0;
  }

  .card-group {
    margin-top: 32px;
  }

  .nftcard {
    width: 300px;
    height: 300px;
    border: 1px solid #67c23a;
  }
}
</style>
