<template lang="pug">
.j-container#collection-page.d-flex.flex-column.gap-40
  .mt-3
    nuxt-link(:to="localePath('nft-market-createnft', $i18n.locale)" :exact='true')
      #return-btn Return - My collection
    .d-flex.justify-content-between.align-items-center.mt-3
      .d-flex.flex-column
        h4 Collection: {{ collectionData && collectionData.collection_name }}
        .fs-14.disable Edit your collection or add schemas and NFTs.
      memory-panel
  .d-flex.justify-content-between
    .nft-image-container.border-radius5.p-0
      .nftcard.create-collections.border-radius5.mr-0.w-100.h-100
        .border-radius5(
          style='position: relative; height: 100%; overflow: hidden; background-color: #202021'
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
            label
              .creation-background.mb-4(
                :style='{ backgroundImage: `url(${require("~/assets/images/createcollection.svg")})` }'
              )
              h4 Add collection image
              h5 (click to browse)
    .nft-info.border-radius5.d-flex.flex-column.justify-content-between(
      v-if='!editable'
    )
      .d-flex.justify-content-between
        .other-info.d-flex.flex-column.gap-24
          div
            .disable Display Name
            .fs-20 {{ collectionData && collectionData.name }}
          div
            .disable Website URL
            .fs-20(v-if='collectionData && collectionData.data.url')
              a.color-action(target='blank', :href='collectionData.data.url') {{ collectionData.data.url.split("https://")[1] }}
          div
            .disable Collection Fee
            .fs-20(v-if='collectionData && collectionData.market_fee') {{ collectionData.market_fee * 100 }}%
        .description-info
          p.description-title Description
          p.description(
            v-if='collectionData && collectionData.data.description'
          ) {{ collectionData.data.description }}
      .d-flex.justify-content-end
        alcor-button(big access @click='() => (this.editable = true)') Edit Collection
    form.nft-info.border-radius5.d-flex.flex-column.justify-content-between.edit-field(
      name='updateCollectionForm',
      @submit='handleUpdate',
      v-else
    )
      .d-flex.justify-content-between
        .other-info
          p.description-title Display Name
            span.color-red *
          input.mt-1.mb-3(
            type='text',
            name='name',
            :value='collectionData && collectionData.name',
            required
          )
          p.description-title Website URL
          input.mt-1.mb-3(
            name='url',
            :value='collectionData && collectionData.data.url'
          )
          p.description-fee Collection Fee
            span.color-red *
          input.mt-1(
            type='number',
            name='fee',
            min='0',
            max='10',
            :value='collectionData && collectionData.market_fee * 100',
            required
          )
        .description-info.d-flex.flex-column
          p.description-title Description
          textarea.description.w-100.flex-fill.mt-1(
            name='description',
            v-if='collectionData && collectionData.data.description'
          ) {{ collectionData.data.description }}
      .d-flex.justify-content-end.gap-16
        alcor-button(big access
          type='button',
          @click='cancelUpdate'
        ) Cancel
        button.btn.create-collection-btn(type='submit') Update Collection
  .schemas-title Schemas
  .d-flex.flex-wrap
    .card-group.d-flex.align-items-start.gap-16
      nuxt-link(
        :to='"/nft-market/createcollection/" + collection_name + "/createschema"',
        :exact='true'
      )
        .card-content
          .plus-round-background(
            :style='{ backgroundImage: `url(${require("~/assets/images/plus_round_icon.svg")})` }'
          )
          h4 Create <br> Schema
      SchemaCard(
        v-for='(item, index) in schemasData',
        :key='index',
        :data='item'
      )
</template>

<script>
import axios from 'axios'
import { mapState } from 'vuex'
import SchemaCard from '~/components/nft_markets/SchemaCard'
import MemoryPanel from '~/components/nft_markets/MemoryPanel'
import AlcorButton from '~/components/AlcorButton'

export default {
  components: {
    SchemaCard,
    MemoryPanel,
    AlcorButton
  },

  data() {
    return {
      value: 73,
      collectionData: '',
      schemasData: [],
      collection_name: '',
      fileList: [],
      loading: false,
      editable: false,
    }
  },
  computed: {
    ...mapState(['user']),
  },
  mounted() {
    console.log(this.$route.name)
    const collectionName = this.$route.params.collection_name
    this.collection_name = collectionName
    this.getSpecificCollectionData(collectionName)
    this.getSchemasData(collectionName)
  },
  methods: {
    cancelUpdate() {
      this.editable = false
      const imageArr = []
      if (this.collectionData.img) {
        imageArr.push({
          url: 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + this.collectionData.img + '&size=370',
        })
      }
      this.fileList = imageArr
    },
    async handleUpdate(e) {
      e.preventDefault()
      const updateCollectionForm = document.forms.updateCollectionForm
      const formData = new FormData(updateCollectionForm)
      const jsonData = Object.fromEntries(formData.entries())
      this.collectionData.data.description = jsonData.description
      this.collectionData.data.url = jsonData.url
      this.collectionData.market_fee = jsonData.fee * 0.01
      this.collectionData.data.name = jsonData.name
      const dataArr = []
      dataArr.push({
        key: 'name',
        value: ['string', jsonData.name],
      })
      if (this.fileList.length) {
        dataArr.push({
          key: 'img',
          value: [
            'string',
            this.fileList[0]
              ? this.fileList[0].url.split(
                'https://resizer.atomichub.io/images/v1/preview?ipfs='
              )[1].replace('&size=370', '')
              : '',
          ],
        })
      }
      if (jsonData.url) {
        dataArr.push({
          key: 'url',
          value: ['string', jsonData.url],
        })
      }
      if (jsonData.description) {
        dataArr.push({
          key: 'description',
          value: ['string', jsonData.description],
        })
      }
      const actions = [
        {
          account: 'atomicassets',
          name: 'setcoldata',
          authorization: [
            {
              actor: this.collectionData.author,
              permission: 'active',
            },
          ],
          data: {
            collection_name: this.collectionData.collection_name,
            data: dataArr,
          },
        },
        {
          account: 'atomicassets',
          name: 'setmarketfee',
          authorization: [
            {
              actor: this.collectionData.author,
              permission: 'active',
            },
          ],
          data: {
            collection_name: this.collectionData.collection_name,
            market_fee: jsonData.fee * 0.01,
          },
        },
      ]
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Collection Update',
          message: 'Collection Updated!',
          type: 'success',
        })
      } catch (e) {
        this.$notify({
          title: 'Collection Update',
          message: e,
          type: 'error',
        })
      } finally {
        this.editable = false
      }
    },
    async getSpecificCollectionData(collectionName) {
      const data = await this.$store.dispatch('api/getSpecificCollectionData', {
        collectionName,
      })
      if (data) {
        if (data.img) {
          this.fileList.push({
            url: 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + data.img + '&size=370',
          })
        }
        this.collectionData = data
      } else {
        this.getSpecificCollectionData(collectionName)
      }
    },
    async getSchemasData(collectionName) {
      const data = await this.$store.dispatch('api/getSchemasData', {
        collectionName,
      })
      this.schemasData = data
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
          url: 'https://resizer.atomichub.io/images/v1/preview?ipfs=' + data.data.data + '&size=370',
        })
      } catch (e) {
        console.error('Get symbol info error', e)
      }
    },
    handleFileRemove(file, fileList) {
      const fileArray = []
      fileList.map((item) => fileArray.push({ url: item.url }))
      this.fileList = fileArray
    },
  },
}
</script>

<style lang="scss">
#collection-page{
  .color-red {
    color: red;
  }

  .border-radius5 {
    border-radius: 5px;
  }

  .nftcard.create-collections.border-radius5 h4 {
    color: white;
  }

  div.page-header_text h4 {
    margin-bottom: 9px !important;
  }

  .page-header_text {
    margin-bottom: 32px;
  }

  .other-info {
    width: 35%;

    h4 {
      font-size: 20px;
    }
  }

  .description-info {
    width: 55%;
  }

  .avatar-uploader {
    width: 100%;
    height: 100%;

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

    label {
      cursor: pointer;
    }

    .el-upload-list__item {
      border: 0;
    }

    .el-upload-dragger {
      background-color: transparent;
      width: 100%;
      height: 100%;
      border: 0;
      display: flex;
      align-items: center;
      justify-content: center;
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

  .creation-background {
    width: 110px;
    height: 107px;
    margin: auto;
  }

  .wax-exchange {
    font-weight: 700;
    font-size: 20px;
    line-height: 15px;
    text-decoration-line: underline;
    color: #67c23a !important;
    word-break: break-all;
    line-height: 1.1;
  }

  .description-name,
  .wax-exchange {
    margin-bottom: 25px !important;
  }

  .description-fee,
  .description-title {
    font-size: 14px;
    color: var(--cancel);
  }

  .description {
    font-size: 16px;
  }

  .create-collection-btn {
    text-align: center;
    width: 154px;
    height: 48px;
    color: #000;
    font-size: 14px;
    font-weight: 500;
    background: #67c23a;
    border-radius: 8px;
    box-shadow: none;
    cursor: pointer;
    :hover {
      background: transparent;
      color: var(--main-action-green);
      border: 1px solid var(--main-action-green);
    }
  }

  .nft-image-container {
    width: 300px;
    height: 300px;
    border-radius: 10px;
  }

  .nft-image-container,
  .nft-info {
    background-color: #202021;
    padding: 24px;
  }

  .nft-info {
    width: calc(100% - 330px);
    min-height: 300px;

    &.edit-field {
      input {
        width: 233px;
        height: 24px;
        border-radius: 2px;
        color: var(--cancel);
        background-color: var(--background-color-third);
        border: none;
      }

      textarea {
        color: var(--cancel);
        background-color: var(--background-color-third);
        border: none;
        border-radius: 2px;
        resize: none;
      }
    }
  }

  .nft-image {
    width: 251px;
    height: 251px;
    object-fit: cover;
  }

  .schemas-title {
    font-weight: 500;
    font-size: 20px;
  }

  .plus-round-background {
    width: 70px;
    height: 70px;
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
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    width: 220px;
    height: 195px;
    background: var(--background-color-third);

    border: 2px solid var(--main-action-green);
    border-radius: 10px;

    display: flex;
    gap: 16px;
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

  .nftcard {
    width: 220px;
    height: 195px;
    border: 2px solid var(--main-action-green);
  }

  .create-collections {
    margin-right: 25px;
  }
}
</style>
