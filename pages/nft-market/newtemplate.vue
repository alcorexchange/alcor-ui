<template lang="pug">
.j-container.createcollection
  div
    nuxt-link(:to='"/nft-market/schemaview"' :exact="true")
      #return-btn Return - Schema: Diamnd
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 New Template
      p Templates can be applied to NFTs, the attributes will then be changed accordingly.
    .page-header-progress.lg-4.md-4.sm-12.xm-12
      .progress-info
        .info-capacity.d-flex.justify-content-between
          div
            span.ques-symbol.border-radius5 ?
            span RAM: 72.27 / 99 KB
          div
            span.more-button Buy more
            span.plus-icon.border-radius5 +
        b-progress(:max='100')
          b-progress-bar(:value='value' :label='`${value}%`')
  .card-group.d-flex.justify-content-between
    .d-flex.align-items-start
      .nftcard.create-collections.border-radius5
        .border-radius5(style='position:relative;height:100%;overflow-y:auto;' @dragover.prevent='' @drop.prevent='')
          UploadImages(@change="handleImages")
          label.card-content
            .creation-background(:style="{ backgroundImage:`url(${require('~/assets/images/createcollection.svg')})`}")
            h4 Add Template image
            h5 (set image attribute))
      .nftcard.nft-form-group
        .nft-input-group
          h4 Max Supply
          input(:type="'text'" placeholder="Infinite ∞")
    .nft-form-group
      .nft-checkbox-item.d-flex.align-items-center
        .nft-checkbox(@click="transfered_state = !transfered_state")
          .checked-img(v-if="transfered_state" :style="{ backgroundImage:`url(${require('~/assets/images/checked.svg')})`}")
        p NFTs can be Transferred
        .form-group_image(:style="{ backgroundImage:`url(${require('~/assets/images/fire.svg')})`}")
      .nft-checkbox-item.d-flex.align-items-center
        .nft-checkbox(@click="burned_state = !burned_state")
          .checked-img(v-if="burned_state" :style="{ backgroundImage:`url(${require('~/assets/images/checked.svg')})`}")
        p NFTs can be Burned
        .form-group_image(:style="{ backgroundImage:`url(${require('~/assets/images/double_arrow.svg')})`}")
      .create-template-btn Create Template
  .add-attribute_header
    .row.add-attribute_header.d-flex
      p Attributes
  .add-attribute_content
    .row.d-flex.align-items-center.justify-content-between(v-for='(item, index) in attribute_data' :key='index')
      p.name-button {{item['name']}}
      p :
      input.input-attribute(placeholder='insert attribute name')
</template>

<script>
import UploadImages from "vue-upload-drop-images"

export default {
  components: {
    UploadImages,
  },

  data() {
    return {
      value: 73,
      files: [],
      transfered_state: true,
      burned_state: true,
      attribute_data: [
        { id: 0, name: 'name', },
        { id: 1, name: 'image', },
        { id: 2, name: 'Clean', },
        { id: 3, name: 'Back', },
      ]
    }
  },
  methods: {
    handleImages(e) {
      console.log("came here")
    }
  }
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
    svg, p {
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
    background-color:#202021;
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
    background: #67C23A;
    border-radius: 8px;
    cursor: pointer;
  }
  .color-red {
    color: red;
  }
  .creation-background
  {
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
    color: #67C23A;
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
      color: #9F979A;
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
  .info-capacity {
    width: 257px;
  }
  .card-group {
    margin-top: 32px;
  }
  .progress {
    margin-top: 4px;
    background-color: #161617;
    .progress-bar {
      background-color: #67C23A;
      color: black;
    }
  }
  .ques-symbol {
    padding: 6px;
    margin-right: 6px;
    color: #9F979A;
    background-color: #202021;
    margin-right: 6px;
    font-weight: 700;
  }
  div.progress-bar {
    text-align: right;
    font-weight: 500;
    font-size: 14px;
    padding-right: 5px;
  }
  .capacity-info {
    margin-bottom: 6px;
  }
  .more-button {
    color: #67C23A;
    margin-right: 8px;
    font-size: 14px;
  }
  .plus-icon {
    font-size: 16px;
    padding: 3px 4px;
    color: black;
    background-color: #67C23A;
  }
  .nftcard {
    width: 300px;
    height: 300px;
    border: 1px solid #67C23A;
  }
  .create-collections {
    margin-right: 25px;
  }
}
</style>
