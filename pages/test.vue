<template lang="pug">
  div
    el-button(@click="test") Test
</template>

<script>
export default {
  layout: 'test',

  methods: {
    async test() {
      const r = await this.$store.dispatch('chain/asyncLogin')

      console.log('R', r)
    }
  }
}

</script>
