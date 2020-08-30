<template lang="pug">
.d-flex.align-items-center
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
        ? 'https://alcor.exchange/' : `https://${this.current_chain}.alcor.exchange/`

      window.location = location + window.location.pathname.split('/')[1] || ''
    }
  }
}
</script>
