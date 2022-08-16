<template lang="pug">
nuxt-link.nftcard.d-flex.align-items-center.justify-content-center.flex-column.text-white(
  :to='"/nft-market/createcollection/" + data.collection.collection_name + "/schema/" + data.schema_name',
  :exact='true'
)
  h3.schema-title.mb-4 {{ data.schema_name }}
  h4.collection_name {{ data.collection.collection_name }}
  P.shema-count {{ data.format.length + "Attributes" }}
</template>

<script>
export default {
  props: ['data'],
}
</script>

<style lang="scss" scoped>
.nftcard {
  width: 220px;
  height: 195px;
  border: 1px solid #67c23a;
  border-radius: 5px;
  margin-right: 25px;
}
.schema-title {
    color: #67c23a;
}
</style>
