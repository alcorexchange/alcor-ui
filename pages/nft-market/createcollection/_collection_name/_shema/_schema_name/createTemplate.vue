<template lang="pug">
.j-container.createcollection
  div
    nuxt-link(
      :to='"/nft-market/createcollection/" + collection_name + "/schema/" + schema_name',
      :exact='true'
    )
      a#return-btn Return - Schema: {{schema_name}}
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 New Template
      p Templates can be applied to NFTs, the attributes will then be changed accordingly.
    MemoryPanel
  .card-group.d-flex.justify-content-between
    .d-flex.align-items-start
      .nftcard.create-collections.border-radius5
        .border-radius5(
          style='position: relative; height: 100%; overflow-y: auto',
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
            label
              .creation-background.mb-4(
                :style='{ backgroundImage: `url(${require("~/assets/images/createcollection.svg")})` }'
              )
              h4 Add collection image
              h5 (click to browse)
      .nftcard.nft-form-group
        .nft-input-group
          h4 Max Supply
          input(
            type='number',
            placeholder='Infinite ∞',
            @input='(e) => (this.max_supply = e.target.value)'
          )
    .nft-form-group
      .nft-checkbox-item.d-flex.align-items-center
        .nft-checkbox(@click='transfered_state = !transfered_state')
          .checked-img(
            v-if='transfered_state',
            :style='{ backgroundImage: `url(${require("~/assets/images/checked.svg")})` }'
          )
        p NFTs can be Transferred
        .form-group_image(
          :style='{ backgroundImage: `url(${require("~/assets/images/fire.svg")})` }'
        )
      .nft-checkbox-item.d-flex.align-items-center
        .nft-checkbox(@click='burned_state = !burned_state')
          .checked-img(
            v-if='burned_state',
            :style='{ backgroundImage: `url(${require("~/assets/images/checked.svg")})` }'
          )
        p NFTs can be Burned
        .form-group_image(
          :style='{ backgroundImage: `url(${require("~/assets/images/double_arrow.svg")})` }'
        )
      button.btn.create-template-btn(@click='handleCreate') Create Template
  .add-attribute_header
    .row.add-attribute_header.d-flex
      p Attributes
  .add-attribute_content
    .row.d-flex.align-items-center.justify-content-between(
      v-for='(item, index) in attribute_data',
      :key='index'
    )
      p.name-button {{ item["name"] }}
      p :
      input.input-attribute(
        placeholder='insert attribute name',
        :value='item.value',
        @input='(e) => (item["value"] = e.target.value)'
      )
</template>

<script>
import { mapState } from 'vuex'
import axios from 'axios'
import MemoryPanel from '~/components/nft_markets/MemoryPanel'

export default {
  components: {
    MemoryPanel
  },

  data() {
    return {
      value: 73,
      files: [],
      loading: false,
      max_supply: '',
      transfered_state: true,
      burned_state: true,
      attribute_data: [],
      collection_name: '',
      schema_name: '',
      fileList: [],
    }
  },
  mounted() {
    const schema_name = this.$route.params.schema_name
    const collection_name = this.$route.params.collection_name
    this.collection_name = collection_name
    this.schema_name = schema_name
    this.getSpecificSchema(schema_name, collection_name)
  },
  computed: {
    ...mapState(['user']),
  },
  methods: {
    handleImages(e) {
      console.log('came here')
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
          url: 'https://gateway.pinata.cloud/ipfs/' + data.data.data,
        })
        this.attribute_data.find((item) => item.type === 'image').value =
          data.data.data
      } catch (e) {
        console.error('Get symbol info error', e)
      }
    },
    handleFileRemove(file, fileList) {
      const fileArray = []
      fileList.map((item) => fileArray.push({ url: item.url }))
      this.fileList = fileArray
    },
    async getSpecificSchema(schema_name, collection_name) {
      const data = await this.$store.dispatch('api/getSpecificSchemasData', {
        collection_name,
        schema_name,
      })
      const schemaArr = []
      data.format.map((item, index) => {
        schemaArr.push({
          id: index,
          name: item.name,
          type: item.type,
          value: '',
        })
      })
      this.attribute_data = schemaArr
    },
    async handleCreate(e) {
      e.preventDefault()
      const dataArr = []
      this.attribute_data.map((item) => {
        if (item.value) {
          dataArr.push({
            key: item.name,
            value: [item.type === 'image' ? 'string' : item.type, item.value],
          })
        }
      })
      const actions = [
        {
          account: 'atomicassets',
          name: 'createtempl',
          authorization: [
            {
              actor: this.user.name,
              permission: 'active',
            },
          ],
          data: {
            authorized_creator: this.user.name,
            collection_name: this.collection_name,
            schema_name: this.schema_name,
            transferable: this.transfered_state,
            burnable: this.burned_state,
            max_supply: +this.max_supply,
            immutable_data: dataArr,
          },
        },
      ]
      console.log(actions)
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Template Creation',
          message: 'Template Creation!',
          type: 'success',
        })
      } catch (e) {
        this.$notify({
          title: 'Template Creation',
          message: e,
          type: 'error',
        })
      } finally {
        this.editable = false
      }
    },
  },
}
</script>

<style lang="scss">
.createcollection {
  .row.add-attribute_header.d-flex {
    margin: 32px 0 21px;
    font-weight: 500;
    font-size: 20px;
  }
  div.row {
    margin: 0;
  }
  .avatar-uploader {
    width: 100%;
    height: 100%;
    overflow: hidden;
    .el-upload {
      width: 100%;
      height: 100%;
      z-index: 1;
      border-radius: 6px;
      color: white;
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
  .creation-background {
    width: 110px;
    height: 107px;
    margin: auto;
  }
  .input-attribute,
  .name-button,
  .type-button {
    color: white;
    border: none;
    width: 233px;
    height: 48px;
    font-size: 16px;
    padding: 10px 0;
    text-align: center;
    border-radius: 8px;
    background-color: #333;
    margin: 6px 0;
  }
  .name-button {
    margin-right: 12px;
    color: var(--cancel);
  }
  input.input-attribute {
    color: #c4c4c4;
    background-color: #161617;
    margin-right: 12px !important;
    flex-grow: 0.9;
  }
  .nft-form-group {
    width: 211px;
    p {
      margin: 0 10px;
      font-size: 14px;
    }
  }
  .checked-img {
    margin: 8px auto;
    width: 11.4px;
    height: 9px;
    background-repeat: no-repeat;
  }
  .nft-checkbox {
    cursor: pointer;
    background-color: #161617;
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }
  .form-group_image {
    width: 14px;
    height: 14px;
  }
  .nft-checkbox-item {
    color: var(--cancel);
    margin-bottom: 18px;
  }
  .nft-input-group {
    padding: 5px 8px;
  }
  .border-radius5 {
    border-radius: 5px;
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
    h4 {
      font-size: 18px !important;
    }
    h5 {
      font-size: 14px;
    }
    input {
      width: 233px;
      height: 24px;
      border-radius: 2px;
      border: none;
      margin: 0 0 12px;
      color: var(--cancel);
      background-color: var(--background-color-third);
    }
  }
  .create-template-btn {
    float: right;
    padding: 14px 23px;
    width: 100%;
    text-align: center;
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
    padding-left: 10px;
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
  .create-collections {
    margin-right: 25px;
  }
}
</style>
