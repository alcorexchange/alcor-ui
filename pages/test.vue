<template lang="pug">
  alcor-container
    el-button(@click="test") Test
    el-button(@click="openCreatePoolModal") Create Pool

    hr

    .token-input
      el-input(placeholder="amount" v-model="input" type="text")
        template(slot="append")
          select-token

</template>

<script>
import { mapActions } from 'vuex'

import SelectToken from '~/components/modals/amm/SelectToken'
import AlcorContainer from '~/components/AlcorContainer'
import TokenImage from '~/components/elements/TokenImage'


export default {
  layout: 'test',
  components: { AlcorContainer, TokenImage, SelectToken },

  data: () => {
    return {
      input: ''
    }
  },

  created() {
    //this.$store.dispatch('amm/placePosition')
  },

  methods: {
    ...mapActions('modal', ['createPool', 'assets']),

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

<style lang="scss">
.token-input {
  width: 300px;

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: white;
    }
  }

  .el-input__inner {
    height: 50px;
  }

  .el-input-group__append {
    //display: flex;
  }

  .el-button {
    border: 1px solid;
    //padding: 5px 5px;
  }

  input {
    background-color: var(--selector-bg);;
  }
}
</style>
