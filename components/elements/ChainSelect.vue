<template lang="pug">
el-radio-group(
  v-if="!isMobile"
  v-model="current_chain"
  @change="changeChain"
  size="small"
  v-loading="loading"
  ).radio-chain-select

  el-radio-button(v-for='network in networks', :key='network.name', :value='network.name' :label="network.name")
    img(:src="require('~/assets/icons/' + network.name + '.png')" height=12)
    span.ml-2 {{ network.name }}

.d-flex.align-items-center(v-else)
  img(:src="require('~/assets/icons/' + current_chain + '.png')" height=30).mr-1

  el-select(v-model='current_chain', placeholder='Select', size="small" @change="changeChain").chain-select
    el-option(v-for='network in networks', :key='network.name', :value='network.name')
      img(:src="require('~/assets/icons/' + network.name + '.png')" height=30)
      span.ml-2 {{ network.desc }}
</template>

<script>
import { mapState } from 'vuex'

import config from '~/config'

export default {
  props: ['current_chain'],

  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['network']),

    networks() {
      return Object.values(config.networks).filter((n) =>
        ['eos', 'telos', 'wax', 'bos', 'proton'].includes(n.name)
      )
    }
  },

  methods: {
    changeChain(v) {
      // TODO Move to config: APP_DOMAIN
      const location =
        this.current_chain == 'eos'
          ? 'https://alcor.exchange/'
          : `https://${this.current_chain}.alcor.exchange/`

      this.loading = true
      window.location = location + window.location.pathname.split('/')[1] || ''
    }
  }
}
</script>

<style lang="scss">
.radio-chain-select {
  label {
    margin-bottom: 0px;
  }
}
</style>
