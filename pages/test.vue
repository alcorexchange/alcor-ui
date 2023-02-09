<template lang="pug">
  div
    el-button(@click="test") Test
</template>

<script>
export default {
  layout: 'test',

  created() {
    //this.$store.dispatch('ibcBridge/fetchTokens')
  },

  methods: {
    async test() {

      //console.log('R', r)
    }
  }
}

</script>
