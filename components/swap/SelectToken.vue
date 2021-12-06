<template lang="pug">
// TODO This part need FUCKING REFACTORING, as swap module at all
.swap-token-select
  .row
    .col
      .multi-input-wrapper(v-bind:style="visible ? 'z-index: 2;' : ''")
        el-input(type="number" v-model="content" :clearable="!static" placeholder="0.0" @input="handleInput" @change="inputChange" :readonly="readonly || static")
          template(slot="append")
            el-button(v-if="isTokenSelected" type="text" @click="toggle")
              .d-flex.align-items-center(v-if="token == 0")
                TokenImage(:src="$tokenLogo(input.symbol, input.contract)" height="25")
                span.ml-2 {{ input.symbol }}
                i.el-icon-bottom.ml-1(v-if="!static")
                i.ml-2(v-else="!static")

              .d-flex.align-items-center(v-else-if="token == 1")
                TokenImage(:src="$tokenLogo(output.symbol, output.contract)" height="25")
                span.ml-2 {{ output.symbol }}
                i.el-icon-bottom.ml-1(v-if="!static")
                i.ml-2(v-else="!static")

              .d-flex.align-items-center(v-else-if="token && token.contract && token.symbol")
                TokenImage(:src="$tokenLogo(token.symbol, token.contract)" height="25")
                span.ml-2 {{ token.symbol }}
                i.el-icon-bottom.ml-1(v-if="!static")
                i.ml-2(v-else="!static")

            el-button(type="text" @click="toggle" v-else-if="!static")
              | Select token
              i.el-icon-bottom.ml-1(v-if="!static")
              i.ml-2(v-else="!static")

      .dropdown(v-show="visible" v-click-outside="hide")
        el-input(placeholder="Search by name or contract" :clearable="!static" v-model="search" size="small" ref="searchInput")

        .pairs.mt-2
          .pair(
            v-for="token in tokensFiltered"
            @click="setToken(token)" :class="{ isActive: isActiveToken(token) }"
          )
            TokenImage(:src="$tokenLogo(token.symbol, token.contract)" height="25")
            span.ml-2 {{ token.symbol }}
            //a(:href="monitorAccount(token.contract)" target="_blank" v-on:click.stop).text-muted.ml-2.small {{ token.contract }}
            .text-muted.ml-2.small {{ token.contract }}

            .ml-auto(v-if="user")
              span.text-muted {{ token.balance | commaFloat }}

          slot(name="end")
</template>

<script>
import ClickOutside from 'vue-click-outside'
import { mapState, mapGetters } from 'vuex'

import TokenImage from '~/components/elements/TokenImage'

export default {
  components: {
    TokenImage
  },

  directives: {
    ClickOutside
  },

  //props: ['value', 'tokens', 'token', 'readonly', 'static'],

  props: {
    value: {
      type: [String, Number],
      default: () => '0.0000'
    },

    tokens: {
      type: Array,
      default: () => []
    },

    token: {
      type: [Number, Object],
      default: () => ''
    },

    readonly: {
      type: Boolean,
      default: () => false
    },

    static: {
      type: Boolean,
      default: () => false
    }
  },

  data() {
    return {
      content: this.value,

      visible: false,
      search: ''
    }
  },

  computed: {
    ...mapState(['user']),
    ...mapState('swap', ['input', 'output']),
    ...mapGetters({
      tokens0: 'swap/tokens0',
      tokens1: 'swap/tokens1',
      pair: 'swap/current',
      inputBalance: 'swap/inputBalance',
      outputBalance: 'swap/outputBalance',

      poolOne: 'swap/poolOne',
      poolTwo: 'swap/poolTwo'
    }),

    isTokenSelected() {
      return (
        (this.token && this.token.contract && this.token.symbol) ||
        (this.token == 0 && this.input) ||
        (this.token == 1 && this.output) ||
        false
      )
    },

    tokensFiltered() {
      return this.tokens.filter((t) => {
        const s = (t.symbol + '@' + t.contract).toLowerCase()
        return s.includes(this.search.toLowerCase())
      }).map(t => {
        t.balance = this.$tokenBalance(t.symbol || t.currency, t.contract)
        return t
      }).sort((a, b) => {
        return a.balance == '0.0000' ? 1 : -1
      }).sort((a, b) => parseFloat(a.balance) < parseFloat(b.balance) ? 1 : -1)
    }
  },

  watch: {
    value() {
      this.content = this.value
    },

    token() {
      this.fixedInput()
    }
  },

  mounted() {
    this.popupItem = this.$el
  },

  methods: {
    hide() {
      this.visible = false
    },

    toggle() {
      if (this.static) return

      this.visible = !this.visible

      if (this.visible) {
        setTimeout(() => {
          this.$refs.searchInput.focus()
        }, 10)
      }
    },

    handleInput(content) {
      this.$emit('input', content)
    },

    isActiveToken(token) {
      if (
        this.token == 0 &&
        this.input &&
        this.input.symbol == token.symbol &&
        this.input.contract == token.contract
      )
        return true
      if (
        this.token == 1 &&
        this.output &&
        this.output.symbol == token.symbol &&
        this.output.contract == token.contract
      )
        return true
      if (
        this.token &&
        this.token.contract &&
        this.token.symbol &&
        this.token.symbol == token.symbol &&
        this.token.contract == token.contract
      )
        return true

      return false
    },

    inputChange(value) {
      this.$emit('inputchange', value)
      this.fixedInput()
    },

    fixedInput() {
      let precision = null

      if (this.token == 0) precision = this.input.precision
      if (this.token == 1) precision = this.output.precision
      if (this.token && this.token.symbol && this.token.contract)
        precision = this.token.precision

      if (!precision) return

      this.content = (parseFloat(this.content) || 0).toFixed(precision)
    },

    setToken(token) {
      this.$emit('change', token)

      // Triggered only on for swap page
      const { input, output } = this
      if (this.token == 0) {
        this.$store.commit('swap/setInput', token)

        if (
          output &&
          token.contract == output.contract &&
          token.symbol == output.symbol
        ) {
          this.$store.commit('swap/setOutput', input)
        } else if (
          output &&
          !this.tokens1.filter(
            (t) => t.contract == output.contract && t.symbol == output.symbol
          )[0]
        ) {
          if (this.tokens1) {
            this.$store.commit('swap/setOutput', this.tokens1[0])
          } else {
            this.$store.commit('swap/setOutput', null)
          }
        }
      }

      if (this.token == 1) {
        this.$store.commit('swap/setOutput', token)

        if (
          input &&
          token.contract == input.contract &&
          input.symbol == output.symbol
        ) {
          this.$store.commit('swap/setInput', output)
        } else if (
          input &&
          !this.tokens0.filter(
            (t) => t.contract == input.contract && t.symbol == input.symbol
          )[0]
        ) {
          if (this.tokens0) {
            this.$store.commit('swap/setInput', this.tokens0[0])
          } else {
            this.$store.commit('swap/setInput', null)
          }
        }
      }
      /////
      this.visible = false
    }
  }
}
</script>

<style lang="scss">
.swap-token-select {
  .dropdown {
    border-radius: var(--radius);

    //will-change: transform;
    position: absolute;
    padding: 20px 10px 10px 10px;

    right: 15px;
    left: 15px;
    bottom: auto;

    margin-top: -8px;

    //<<<<<<< HEAD FIXME
    background: var(--background-color-base);
    //=======
    //    background: var(--bg-alter-1);
    //>>>>>>> newUI
    z-index: 1;

    height: 310px;
    overflow: hidden;
    box-shadow: var(--dropdown-shadow);

    .pairs {
      overflow-y: auto;
      height: calc(100% - 32px);
    }
  }

  .el-dialog__body {
    padding: 25px 20px;
  }

  .el-button.is-round {
    padding: 7px 23px;
  }
}

.pair {
  display: flex;

  cursor: pointer;
  padding: 10px 8px;
  border-radius: 5px;
  align-items: center;
  margin-top: 5px;
}

.pair:hover,
.isActive {
  background-color: var(--background-color-secondary);
}

.multi-input-wrapper {
  padding: 8px 15px;
  background: var(--background-color-base);
  border-radius: 6px;
  position: relative;

  .el-input {
    font-size: 18px;

    .el-input-group__append {
      border: none;
      background: transparent;
    }
  }

  .el-input__inner {
    background-color: transparent !important;
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

.theme-light {
  .multi-input-wrapper {
    background: var(--background-color-secondary);
  }
}

.theme-dark {
  .swap-token-select {
    .dropdown {
      .el-input__inner {
        background-color: #232424;
        border: none;
      }
    }
  }
}
</style>
