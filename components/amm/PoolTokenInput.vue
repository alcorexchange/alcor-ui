<template lang="pug">
.pool-token-input
  el-input(placeholder="0.0" :value="value" @input="$emit('input', $event)" @blur="$emit('blur')" type="number")
    template(slot="append")
      .d-flex.align-items-center.gap-4
        max-bage(v-if="showMaxButton" @click="$emit('onMax')")
        select-token(:token="token" :tokens="tokens" @selected="$emit('tokenSelected', $event)")
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import SelectToken from '~/components/modals/amm/SelectToken'
import MaxBage from '~/components/UI/input/MaxBage'

export default {
  components: {
    SelectToken,
    MaxBage
  },

  props: ['token', 'tokens', 'disabled', 'value', 'showMaxButton'], // TODO Disabled

  data: () => ({
    input: '',
    search: ''
  }),

  computed: {
    ...mapState(['user'])
  }
}
</script>

<style lang="scss">
.pool-token-input {
  width: 100%;

  .select-token-button {
    display: flex;
    align-items: center;

    padding: 5px 9px;
    background: var(--btn-default);
    border: 1px solid var(--btn-default);
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      border-color: var(--text-disable);
      color: var(--text-disable);
    }
  }

  .el-input__inner {
    height: 50px;
  }

  .el-input-group__append,
  .el-input__inner {
    border-color: var(--selector-bg);
    background: var(--selector-bg);
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


.token-select {
  padding: 10px 16px !important;
  border-radius: 4px !important;
}
.token-select,
.el-popup-parent--hidden {

  .token-select.scroller {
    padding: 0px 10px;
  }

  .search {
    width: 373px;
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 10px;
    background: var(--background-color-base);

    .el-input__inner {
      background: var(--background-color-secondary);
      font-size: 12px;
      border-radius: 4px;
    }
  }

  .amount {
    .el-input__inner {
      font-size: 18px;
    }
    &.is-disabled {
      .el-input__inner {
        background-color: var(--background-color-secondary);
      }
    }
  }

  .selected svg {
    width: 10px;
    height: 10px;
  }
  .selected svg[data-icon='dollar'] {
    height: 40px;
    width: 40px;
  }

  .el-dropdown-menu.element-options {
    top: 60px;
    padding: 0;
    border-radius: 5px;
    border: none;
    max-height: 300px;
  }

  .el-input-number .el-input {
    font-size: 16px;
  }

  .token {
    border-radius: 5px;
    cursor: pointer;
  }
  .token:hover,
  .token.active {
    background: var(--background-color-secondary);
  }
}


</style>
