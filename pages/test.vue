<template lang="pug">
alcor-container
  el-button(@click="test") Test
</template>

<script>
import { mapState, mapActions } from 'vuex'

import AlcorContainer from '~/components/AlcorContainer'

export default {
  layout: 'test',
  components: { AlcorContainer },

  data: () => {
    return {
      input: ''
    }
  },

  computed: {
    ...mapState(['user', 'network']),

  },

  created() {
  },

  methods: {
    ...mapActions('modal', ['createPool', 'assets']),

    async test() {
      const wallet = this.$store.state.chain.wallet
      const signProvider = wallet.session.link.makeSignatureProvider()

      function bytesToHex(bytes) {
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
      }

      // Пример: создание hex строки из массива байтов
      const byteArray = [0, 255, 128, 64, 32]
      const hexString = bytesToHex(byteArray)


      const data = {
        chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',

        requiredKeys: ['EOS7cFXxd9456zKamT2X6k9W6RktmcWyM4Gx5x3egKfxRY8VS1ii7'],

        /** Transaction to sign */
        serializedTransaction: hexString,

        abis: []
      }

      const r = await signProvider.sign(data)

      console.dir(r)

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
