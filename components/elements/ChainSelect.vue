<template lang="pug">
  el-select(v-model='current_chain', placeholder='Select', size="mini" @change="changeChain").chain-select
    el-option(v-for='network in networks', :key='network.name', :value='network.name')
      img(:src="require('~/assets/icons/' + network.name + '.png')" height=25)
      span.ml-2 {{ network.desc }}
</template>

<script>
import { mapState } from 'vuex'

import config from '~/config'

export default {
  props: ['current_chain'],

  computed: {
    ...mapState(['network']),

    networks() {
      return Object.values(config.networks)
    }
  },

  methods: {
    changeChain(v) {
      // TODO Move to config: APP_DOMAIN
      const location = this.current_chain == 'eos'
        ? 'https://alcor.exchange' : `https://${this.current_chain}.alcor.exchange`

      window.location = location + window.location.pathname
    }
  }
}
</script>
