<template lang="pug">
// FIXME Do not use
  el-input(type="number" v-model="value" @change clearable)
    //span(slot="suffix").mr-1 {{ market.token.symbol.name }} 
    span(slot="suffix").mr-1 asdf
</template>

<script>

export default {
  props: {
    value: {
      type: Number,
      default: () => {}
    }
  }
}
</script>
