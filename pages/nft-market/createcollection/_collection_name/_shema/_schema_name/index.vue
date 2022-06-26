<template lang="pug">
.j-container.schemaview
  div
    nuxt-link(
      :to='"/nft-market/createcollection/" + collection_name',
      :exact='true'
    )
      a#return-btn Return - Collection: {{ collection_name }}
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 Create Schema in:
        span.color-green &nbsp;{{ schema_name }}
      p Schemas are a group of attributes that are attached to your NFTs.
    MemoryPanel
  div
    .d-flex
      .add-attribute
        .add-attribute_header
          .row.add-attribute_header.d-flex
            p Attribute name:
            p Attribute type:
        .add-attribute_content
          div(v-for='(item, index) in attribute_data', :key='index')
            p.error-text.ml-2.mt-2(v-if='!item["value"]') Name cannot be empty
            p.error-text.ml-2.mt-2(
              v-else-if='attribute_data.filter((data) => data.value === item["value"]).length > 1 && !item["defaultValue"]'
            ) Name has to be unique in schema
            .row.d-flex.align-items-center
              p.minus-button(
                v-if='!item["defaultValue"]',
                @click='deleteitem(item["id"])',
                :style='{ backgroundImage: `url(${require("~/assets/images/minus_radius.svg")})` }'
              )
              input.input-attribute(
                v-if='!item["defaultValue"]',
                @input='(e) => (item.value = e.target.value)',
                placeholder='insert attribute name'
              )
              el-select(v-if='!item["defaultValue"]', v-model='item["type"]')
                el-option(
                  v-for='option in options',
                  :key='option.value',
                  :label='option.label',
                  :value='option.value'
                )
              p.name-button(v-if='item["defaultValue"]') {{ item["defaultValue"] }}
              p.type-button(v-if='item["defaultValue"]') {{ item["label"] }}
        button.btn.add-button(@click='additem()') + Add Attribute
      .d-flex.flex-fill.justify-content-center
        button.btn.create-schema-btn.d-block(
          v-if='(schemaData.format && schemaData.format.length) != attribute_data.length',
          :disabled='error',
          @click='handleUpdate'
        ) Create Schema
    h4.nft-title NFTs:
    .nftcard.create-collections.radius10.d-flex.justify-content-center.align-items-center
      .card-content
        .plus-round-background(
          :style='{ backgroundImage: `url(${require("~/assets/images/plus_round_icon.svg")})` }'
        )
        h4 Mint NFT
    h4.nft-title Templates:
    .d-flex.flex-wrap
      .nftcard.create-collections.radius10.d-flex.justify-content-center.align-items-center.template-card
        nuxt-link(
          :to='"/nft-market/createcollection/" + collection_name + "/schema/" + schema_name + "/createTemplate"',
          :exact='true'
        )
          .card-content
            .plus-round-background(
              :style='{ backgroundImage: `url(${require("~/assets/images/plus_round_icon.svg")})` }'
            )
            h4.color-white New Templates
      TemplateCard.mr-3.mb-4(
        v-for='(item, index) in templateData',
        :key='index',
        :cardData='item',
        mode='template'
      )
</template>

<script>
import { mapState } from 'vuex'
import TemplateCard from '~/components/nft_markets/cards/TemplateCard'
import MemoryPanel from '~/components/nft_markets/MemoryPanel'

export default {
  components: {
    TemplateCard,
    MemoryPanel
  },

  data() {
    return {
      cardData: {
        maker: 'flfum.wam',
        creator: 'AlcorExchange',
        showNFTdata: false,
        showNFTvalue: true,
        nftvalue: 0,
        btnname: 'Details',
      },
      options: [
        { value: 'uint64', label: 'Integer Number' },
        { value: 'double', label: 'Floating Point Number' },
        { value: 'string', label: 'Text' },
        { value: 'image', label: 'Image' },
        { value: 'ipfs', label: 'IPFS Hash' },
        { value: 'bool', label: 'Boolean' },
      ],
      attribute_data: [],
      value: 73,
      schema_name: '',
      collection_name: '',
      schemaData: '',
      templateData: [],
    }
  },
  computed: {
    ...mapState(['user']),
    error() {
      if (this.attribute_data.find((item) => item.value === '')) return true
      else {
        const arr = this.attribute_data.map((item) => {
          if (
            this.attribute_data.filter((data) => data.value === item.value)
              .length > 1
          ) {
            return true
          }
        })
        if (arr.find((item) => item === true)) {
          return true
        } else {
          return false
        }
      }
    },
  },
  mounted() {
    const schema_name = this.$route.params.schema_name
    const collection_name = this.$route.params.collection_name
    this.schema_name = schema_name
    this.collection_name = collection_name
    this.getSpecificSchema(schema_name, collection_name)
    this.getTemplatesData(schema_name, collection_name)
  },
  methods: {
    deleteitem(id) {
      this.attribute_data = this.attribute_data.filter((item) => item.id != id)
    },
    async handleUpdate() {
      const dataArr = []
      this.attribute_data.map((item, index) => {
        if (this.schemaData.format.length <= index)
          dataArr.push({
            name: item.value,
            type: item.type,
          })
      })
      const actions = [
        {
          account: 'atomicassets',
          name: 'extendschema',
          authorization: [
            {
              actor: this.user.name,
              permission: 'active',
            },
          ],
          data: {
            authorized_editor: this.user.name,
            collection_name: this.collection_name,
            schema_name: this.schema_name,
            schema_format_extension: dataArr,
          },
        },
      ]
      try {
        await this.$store.dispatch('chain/sendTransaction', actions)
        this.$notify({
          title: 'Schema Update',
          message: 'Schema Updated!',
          type: 'success',
        })
      } catch (e) {
        this.$notify({
          title: 'Schema Update',
          message: e,
          type: 'error',
        })
      } finally {
        this.loading = false
      }
    },
    additem() {
      this.attribute_data.push({
        id: this.attribute_data[this.attribute_data.length - 1].id + 1,
        defaultValue: '',
        value: '',
        type: this.options[0].value,
      })
    },
    async getSpecificSchema(schema_name, collection_name) {
      const data = await this.$store.dispatch('api/getSpecificSchemasData', {
        collection_name,
        schema_name,
      })
      this.schemaData = data
      const schemaArr = []
      data.format.map((item, index) => {
        schemaArr.push({
          id: index,
          defaultValue: item.name,
          label: this.options.find((option) => option.value === item.type)
            .label,
          type: item.type,
          value: item.name,
          selectedValue: '',
        })
      })
      this.attribute_data = schemaArr
    },
    async getTemplatesData(schema_name, collection_name) {
      const data = await this.$store.dispatch('api/getTemplatesData', {
        limit: 40,
        collectionName: collection_name,
        schemaName: schema_name,
      })
      this.templateData = data
    },
  },
}
</script>

<style lang="scss">
.schemaview {
  .radius10 {
    border-radius: 10px;
  }
  .color-white {
    color: #fff !important;
  }
  .error-text {
    color: red;
    font-size: 12px;
  }
  .nft-title {
    margin: 32px 0;
  }
  .el-input__suffix {
    right: 25px !important;
  }
  .theme-dark .el-select-dropdown,
  .el-input__inner {
    height: 48px;
    background-color: #333;
    border-radius: 5px;
    text-align: center;
  }
  .el-select-dropdown__item {
    text-align: center !important;
  }
  .el-select {
    width: 233px;
  }
  .border-radius5 {
    border-radius: 5px;
  }
  div.row {
    margin: 0;
  }
  .minus-button {
    position: absolute;
    transform: translate(-30px, 0);
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  input.input-attribute {
    color: #c4c4c4;
    background-color: #161617;
    margin-right: 12px !important;
  }
  .add-button {
    width: 100%;
    font-size: 14px;
    margin-top: 18px;
    text-align: center;
    color: #c4c4c4;
    background-color: #161617;
    border: 1px solid #67c23a;
    padding: 16px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
  }
  .custom-select {
    background: url('~/assets/images/under.svg') right 80px center/8px 10px
      no-repeat;
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
  .type-button {
    color: white;
  }
  .add-attribute_header {
    font-weight: 500;
    font-size: 20px;
    p:first-child {
      margin-right: 12px;
    }
    p {
      width: 233px;
    }
  }
  .add-attribute {
    width: 478px;
  }
  .create-schema-btn {
    width: 233px;
    height: 32px;
    background-color: #67c23a;
    border-radius: 4px;
    text-align: center;
    font-weight: 500;
    color: black;
    padding: 3px 23px;
    cursor: pointer;
  }
  input {
    width: 233px;
    height: 24px;
    border-radius: 2px;
    border: none;
    margin: 6px 0 !important;
    color: var(--cancel);
    background-color: var(--background-color-third);
  }
  .color-red {
    color: red;
  }
  .color-green {
    color: #67c23a;
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
  .wax-exchange {
    font-weight: 700;
    font-size: 20px;
    line-height: 15px;
    text-decoration-line: underline;
    color: #67c23a;
  }
  .description-name,
  .wax-exchange {
    margin-bottom: 32px !important;
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
    float: right;
    text-align: center;
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
  .nft-image-container {
    padding: 24px 25px 25px 25px;
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
  }
  .nft-image {
    width: 251px;
    height: 251px;
    object-fit: cover;
  }
  .schemas-title {
    margin: 43px 0;
    font-weight: 500;
    font-size: 20px;
  }
  .plus-round-background {
    width: 70px;
    height: 70px;
    margin: auto;
  }
  .card-content {
    margin-top: 23px;
    font-weight: 700;
    font-size: 24px;
    text-align: center;
    h4 {
      margin: 10px 0;
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
    width: 220px;
    height: 300px;
    border: 1px solid #67c23a;
  }
  .template-card {
    height: 174px;
  }
  .create-collections {
    margin-right: 25px;
  }
}
</style>
