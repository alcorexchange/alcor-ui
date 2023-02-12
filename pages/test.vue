<template lang="pug">
  div
    el-button(@click="test") Test
</template>

<script>
export default {
  layout: 'test',

  created() {
  },

  methods: {
    async test() {
      this.$store.dispatch('amm/placePosition')
      //console.log('R', r)
    }
  }
}

</script>
