<template lang="pug">
nuxt-link(:to='"/nft-market/createcollection/" + data.collection_name', :exact='true')
    .collection-card.almemes.border-radius5.d-flex.flex-column.p-2
        .almemes-background(
        :style='imageBackground'
        )
        h4.text-center {{ data.collection_name }}
</template>

<script>
export default {
  props: ['data'],
  computed: {
    imageBackground() {
      if (this.data.data.img) {
        return {
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: this.data.data.img.includes('https://')
            ? this.data.data.img
            : 'url(https://ipfs.atomichub.io/ipfs/' +
              this.data.data.img +
              ')'
        }
      } else return false
    },
  },
}
</script>
<style lang="scss" scoped>
.collection-card {
    width: 220px;
    height: 300px;
    margin-bottom: 20px;
    border: 1px solid #67c23a;
    .almemes-background {
        width: 100%;
        height: 250px;
    }
    &.almemes {
        h4 {
        margin: 30px 0 0 !important;
        color: #67c23a !important;
        }
    }
}
</style>
