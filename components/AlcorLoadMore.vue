<template lang="pug">
.d-flex.justify-content-center.mt-4.load-more
  AlcorButton.action(@click="onLoadMore" v-loading="loading" element-loading-spinner="el-icon-loading") Load More ...
</template>

<script>
import AlcorButton from '@/components/AlcorButton'
export default {
  components: {
    AlcorButton
  },
  props: ['loading'],
  methods: {
    onLoadMore() {
      this.$emit('loadMore')
    }
  }
}
</script>

<style scoped lang="scss">
.action{
  min-width: 240px;
}
</style>
