<template lang="pug">
.swap-token-select
  el-button(v-if="isTokenSelected" round @click="open")
    div(v-if="token == 0")
      TokenImage(:src="$tokenLogo(input.symbol, input.contract)" height="25")
      span.ml-2 {{ input.symbol }}
      i.el-icon-bottom.ml-1

    div(v-if="token == 1")
      TokenImage(:src="$tokenLogo(output.symbol, output.contract)" height="25")
      span.ml-2 {{ output.symbol }}
      i.el-icon-bottom.ml-1

  el-button(round @click="open" v-else)
    | Select token
    i.el-icon-bottom.ml-1

  el-dialog(title="Select a token", :visible.sync="visible" width="30%").text-left
    el-input(placeholder="Search by name or contract" v-model="search").w-100

    .lead.text-dark.mt-3 Token name

    .pair(v-for="token in tokensFiltered" @click="setToken(token)")
      TokenImage(:src="$tokenLogo(token.symbol, token.contract)" height="30")
      span.ml-2 {{ token.symbol }}
      a(:href="monitorAccount(token.contract)" target="_blank").text-muted.ml-2 {{ token.contract }}

</template>

<script>
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  props: {
    token: {
      type: Number,
      default: () => {
        return 0
      }
    }
  },

  data() {
    return {
      visible: false,

      search: ''
    }
  },

  computed: {
    ...mapState('swap', ['pairs', 'input', 'output']),
    ...mapGetters({
      tokens0: 'swap/tokens0',
      tokens1: 'swap/tokens1'
    }),

    isTokenSelected() {
      if (this.token == 0 && this.input) return true
      if (this.token == 1 && this.output) return true

      return false
    },

    tokensFiltered() {
      const tokens = this.token == 0 ? this.tokens0 : this.tokens1

      return tokens.filter(t => {
        const s = (t.symbol + '@' + t.contract).toLowerCase()
        return s.includes(this.search.toLowerCase())
      })
    }
  },

  methods: {
    open() {
      this.visible = true
    },

    setToken(token) {
      if (this.token == 0) {
        if (this.output && token.contract == this.output.contract && token.symbol == this.output.symbol) {
          this.$store.commit('swap/setOutput', this.input)
        }

        this.$store.commit('swap/setInput', token)
      } else {
        if (token.contract == this.input.contract && token.symbol == this.input.symbol) {
          this.$store.commit('swap/setInput', this.output)
        }

        this.$store.commit('swap/setOutput', token)
      }

      this.visible = false
    }
  }
}
</script>

<style lang="scss">
.swap-token-select {
  .el-dialog__body {
    padding: 5px 20px;
  }

  .el-button.is-round {
    padding: 7px 23px;
  }
}
</style>

<style scoped>
.pair {
  cursor: pointer;
  padding: 15px;
}

.pair:hover {
  background-color: var(--active-row);
}
</style>
