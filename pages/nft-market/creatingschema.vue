<template lang="pug">
.j-container.creatingschema
  div
    nuxt-link(:to='"/nft-market"' :exact="true")
      #return-btn Return - Collection: Alcorex
  .page-header.d-flex.justify-content-between.row
    .page-header_text.lg-8.md-4.sm-12.xm-12
      h4 Create Schema in:
        span.color-green &nbsp;Alcorex
      p Edit your collection or add schemas and NFTs.
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
  .d-flex.justify-content-between
    .schema-create
      p.description-title Schema Name
      p.validation-name (12 Characters max)
        span.color-red *
      input(:type="'text'")
      nuxt-link(:to='"/nft-market/schemaview"' :exact="true")
        .create-schema-btn Create Schema
    .add-attribute
      .add-attribute_header
        .row.add-attribute_header.d-flex
          p Attribute name:
          p Attribute type:
      .add-attribute_content
        .row.d-flex.align-items-center(v-for='(item, index) in attribute_data' :key='index')
          p.minus-button(v-if='!item["name"]' @click='deleteitem(item["id"])' :style="{ backgroundImage: `url(${require('~/assets/images/minus_radius.svg')})` }")
          input.input-attribute(v-if='!item["name"]' placeholder='insert attribute name')
          el-select(v-if='!item["name"]' v-model='item["selectedValue"]' placeholder='Select type')
            el-option(v-for='option in options' :key='option.value' :label='option.label' :value='option.value')
          p.name-button(v-if='item["name"]') {{ item['name'] }}
          p.type-button(v-if='item["name"]') {{ item['type'] }}
      p.add-button(@click='additem()') + Add Attribute
</template>

<script>

export default {
  data() {
    return {
      options: [
        { value: 'Text', label: 'Text' },
        { value: 'image', label: 'image' },
      ],
      value: 73,
      attribute_data: [
        { id: 0, name: 'name', type: 'Text', selectedValue: '' },
        { id: 1, name: 'image', type: 'image', selectedValue: '' },
        { id: 2, name: '', type: 'Text', selectedValue: 'Text' },
        { id: 3, name: '', type: 'image', selectedValue: 'image' },
      ]
    }
  },
  methods: {
    deleteitem(id) {
      this.attribute_data = this.attribute_data.filter((item) => item.id != id)
    },
    additem() {
      this.attribute_data.push({ id: this.attribute_data[this.attribute_data.length - 1].id + 1, name: '', type: this.options[0].text })
    }
  }
}
</script>

<style lang="scss">
.progress-info {
  display: flex;
  flex-direction: column;
  gap: 10 px;
}

.creatingschema {
  .el-input__suffix {
    right: 65px !important;
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
    border: 1px solid #67C23A;
    padding: 16px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
  }

  .custom-select {
    background: url('~/assets/images/under.svg') right 80px center/8px 10px no-repeat;
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
    background-color: #67C23A;
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
    color: #67C23A;
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
    color: #67C23A;
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
    background: #67C23A;
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
    width: 220px;
    height: 195px;
    border: 1px solid #67C23A;
  }

  .create-collections {
    margin-right: 25px;
  }
}
</style>
