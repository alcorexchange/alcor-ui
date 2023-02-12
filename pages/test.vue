<template lang="pug">
  div
    el-button(@click="test") Test
    el-button(@click="openCreatePoolModal") Create Pool
</template>

<script>
import { mapActions } from 'vuex'

export default {
  layout: 'test',

  created() {
    //this.$store.dispatch('amm/placePosition')
  },

  methods: {
    ...mapActions('modal', ['createPool']),

    openCreatePoolModal() {
      this.createPool()
    },

    async test() {
      //this.$store.dispatch('amm/init')
      this.$store.dispatch('amm/placePosition')
      //console.log('R', r)
    }
  }
}

</script>
