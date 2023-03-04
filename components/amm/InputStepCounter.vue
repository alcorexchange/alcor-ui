<template lang="pug">
  el-input(v-model="localValue" @change="onChange")
</template>

<script>
export default {
  props: ['value'],

  data() {
    return {
      localValue: ''
    }
  },

  watch: {
    value() {
      this.localValue = this.value
    }
  },

  mounted() {
    this.localValue = this.value
  },

  methods: {
    onChange(event) {
      this.$emit('change', event)

      // Force update lovalvalue in case change value did not had effect
      setTimeout(() => {
        console.log('upd local')
        this.localValue = this.value
      })
    }
  }
}
</script>
