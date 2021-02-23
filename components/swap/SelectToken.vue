<template lang="pug">
.swap-token-select
  small.text-muted Pay
  small.text-mutted.small.align-self-end.float-right {{ inputBalance }}
    i.el-icon-wallet.ml-1
  .multi-input-wrapper
    el-input(type="number" v-model="content" clearable placeholder="0.0" @input="handleInput" @change="fixedInput" :readonly="readonly")
      template(slot="append")
        el-button(v-if="isTokenSelected" type="text" @click="open")
          .d-flex.align-items-center(v-if="token == 0")
            TokenImage(:src="$tokenLogo(input.symbol, input.contract)" height="25")
            span.ml-2 {{ input.symbol }}
            i.el-icon-bottom.ml-1

          div(v-if="token == 1")
            TokenImage(:src="$tokenLogo(output.symbol, output.contract)" height="25")
            span.ml-2 {{ output.symbol }}
            i.el-icon-bottom.ml-1

        el-button(type="text" @click="open" v-else)
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

  props: ['value', 'token', 'readonly'],

  data() {
    return {
      content: this.value,

      visible: false,
      search: ''
    }
  },

  computed: {
    ...mapState('swap', ['input', 'output']),
    ...mapGetters({
      tokens0: 'swap/tokens0',
      tokens1: 'swap/tokens1',
      pair: 'swap/current',
      inputBalance: 'swap/inputBalance',
      outputBalance: 'swap/outputBalance'
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

  watch: {
    value() {
      this.content = this.value
    }
  },

  methods: {
    handleInput (content) {
      this.$emit('input', content)
    },

    open() {
      this.visible = true
    },

    fixedInput() {
      return this.content = (parseFloat(this.content) || 0).toFixed(this.input.precision)
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

.pair {
  cursor: pointer;
  padding: 15px;
}

.pair:hover {
  background-color: var(--active-row);
}

.multi-input-wrapper {
  padding: 8px;
  // TODO background: #282828;
  background: #e6eef1;
  border-radius: 6px;

  .el-input {
    font-size: 18px;

    .el-input-group__append {
      border: none;
    }
  }

  .el-input__inner {
    background-color: transparent;
    border: none;
  }

  input {
    font: inherit;
    color: currentColor;
    width: 100%;
    border: 0;
    height: 1.1876em;
    margin: 0;
    display: block;
    padding: 6px 0 7px;
    min-width: 0;
    background: none;
    box-sizing: content-box;
    animation-name: mui-auto-fill-cancel;
    letter-spacing: inherit;
    animation-duration: 10ms;
    -webkit-tap-highlight-color: transparent;
  }
}
</style>
