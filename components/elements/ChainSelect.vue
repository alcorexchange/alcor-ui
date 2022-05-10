<template lang="pug">
.d-flex.align-items-center.chain-select
  .connection-status.mr-2
  el-dropdown
    .network-selection
      img.mr-2(
        :src='require("~/assets/icons/" + current_chain.name + ".png")',
        height=25
      )

      span(v-if='isMobile') {{ current_chain.name }}
      span(v-else) {{ current_chain.desc }}
      i.el-icon-arrow-down.ml-1

    template(#dropdown='')
      el-dropdown-menu.dropdown-container.chain-select-dropdown
        .d-item(
          v-for='network in networks',
          :key='network.name',
          :value='network.name',
          :label='network.name',
          @click='changeChain(network.name)'
        )
          img(
            :src='require("~/assets/icons/" + network.name + ".png")',
            height=25
          )
          span.ml-2(v-if='isMobile') {{ network.name }}
          span.ml-2(v-else) {{ network.desc }}
</template>

<script>
import { mapState } from 'vuex'

import config from '~/config'

export default {
  data() {
    return {
      loading: false
    }
  },

  computed: {
    ...mapState(['network']),

    current_chain() {
      return this.$store.state.network
    },

    networks() {
      return Object.values(config.networks).filter((n) =>
        ['eos', 'telos', 'wax', 'bos', 'proton'].includes(n.name)
      )
    }
  },

  methods: {
    changeChain(to) {
      const location =
        to == 'wax'
          ? 'https://alcor.exchange/'
          : `https://${to}.alcor.exchange/`

      this.loading = true
      window.location = location + window.location.pathname.split('/')[1] || ''
    }
  }
}
</script>

<style lang="scss">
.chain-select-dropdown {
  .d-item {
    display: flex;
    text-align: center;
    padding: 4px 12px;
    min-width: 150px;
    color: var(--text-default);
    cursor: pointer;
    &:hover {
      background: var(--hover);
    }
  }
}

.chain-select {
  .network-selection {
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--text-default);
    span {
      margin-right: 2px;
    }
  }

  .connection-status {
    /* TODO Add connection status logic */
    width: 5px;
    height: 5px;
    left: 18px;
    top: 12px;

    background: var(--main-green);
    border-radius: 5px;
  }

  .radio-chain-select {
    label {
      margin-bottom: 0px;
    }
  }
}

</style>
