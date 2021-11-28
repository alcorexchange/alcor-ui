<template lang="pug">
    .nft-card.alcor-card
      .type
        .icon
        .type-name.cancel {{id}}
      .image
        img(:src="mdata.img")
      .details
        h3.name {{mdata.name}}
        .item
          span.key.cancel Author:&nbsp;
          span.value {{author}}
        .item
          span.key.cancel Category:&nbsp;
          span.value {{category}}
        //- .item
        //-   span.key.cancel Created:&nbsp;
        //-   span.value 01, December 2020
        .actions
          AlcorButton(@click="$emit('showDetails', $props)").action Details
          AlcorButton(@click="$emit('send', {nft: $props})").action
            span Send
            i.el-icon-s-promotion.ml-2
        //- .right
        //-   .item
        //-     span.key.cancel Purchase price
        //-     span.value 1400 WAX
        //-     span.footer.cancel (400$)
        //-   .item
        //-     span.key.cancel Last price
        //-     span.value 160000 WAX
        //-     span.footer.cancel (6000$)
</template>

<script>
// import AlcorLink from '@/components/AlcorLink.vue'
import AlcorButton from '@/components/AlcorButton.vue'
export default {
  name: 'NFTCard',
  components: {
    // AlcorLink,
    AlcorButton
  },
  props: ['author', 'category', 'mdata', 'idata', 'id']
}
</script>

<style scoped lang="scss">
$space: 8px;
$fontSize: 0.86rem;
.nft-card {
  width: 100%;
  // max-width: 280px;
  border-radius: 20px;
}
.type {
  display: flex;
  flex-direction: column;
}
.image {
  width: 200px;
  height: 200px;
  margin: 10px auto;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}
.details {
  display: flex;
  flex-direction: column;
  h3 {
    font-size: 1.2rem;
  }
  .item {
    margin-bottom: 4px;
    font-size: $fontSize;
  }
  .actions {
    display: flex;
    margin-top: $space;
    gap: 8px;
    .action::v-deep {
      flex: 1;
      border-radius: 10px;
      padding: 8px 24px !important;
    }
  }
  // .right {
  //   width: 40%;
  //   .item {
  //     display: flex;
  //     flex-direction: column;
  //     margin-bottom: $space;
  //     .footer {
  //       font-size: $fontSize;
  //     }
  //   }
  // }
}
</style>
